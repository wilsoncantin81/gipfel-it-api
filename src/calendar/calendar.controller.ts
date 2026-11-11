import {
  Controller, Get, Post, Put, Delete,
  Param, Body, UseGuards, Request, Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../common/prisma.service';
import { sendWhatsapp } from '../common/notify';
import { CronOrJwtGuard } from '../auth/cron-or-jwt.guard';
import { Cron } from '@nestjs/schedule';

@ApiTags('Calendar')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('calendar')
export class CalendarController {
  constructor(private prisma: PrismaService) {}

  /** Quita los eventos cuyo ticket está CERRADO y agrega ticketStatus a los demás */
  private async withoutClosedTickets(events: any[]): Promise<any[]> {
    const ids = [...new Set(events.map((e: any) => e.ticketId).filter(Boolean) as string[])];
    if (!ids.length) return events;
    const tickets = await this.prisma.ticket.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true, supportTechIds: true } as any,
    });
    const byId = new Map<string, any>(tickets.map((t: any) => [t.id, t]));
    return events
      .filter((e: any) => !e.ticketId || byId.get(e.ticketId)?.status !== 'CERRADO')
      .map((e: any) => (e.ticketId
        ? { ...e, ticketStatus: byId.get(e.ticketId)?.status, supportTechIds: byId.get(e.ticketId)?.supportTechIds || [] }
        : e));
  }

  @Get()
  async findAll(@Query('month') month?: string, @Query('year') year?: string) {
    const where: any = {};
    if (month && year) {
      // Filter by month/year prefix: "2026-10"
      const prefix = `${year}-${month.padStart(2, '0')}`;
      where.date = { startsWith: prefix };
    }
    const events = await this.prisma.calendarEvent.findMany({
      where,
      orderBy: [{ date: 'asc' }, { timeStart: 'asc' }],
    });
    return this.withoutClosedTickets(events);
  }

  @Post()
  async create(@Body() body: any, @Request() req: any) {
    const userId = req.user.sub;
    const dbUser = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
    return this.prisma.calendarEvent.create({
      data: {
        date: body.date,
        type: body.type || 'otro',
        title: body.title,
        techId: body.techId || null,
        techName: body.techName || null,
        ticketId: body.ticketId || null,
        ticketNum: body.ticketNum || null,
        ticketLabel: body.ticketLabel || null,
        timeStart: body.timeStart || null,
        timeEnd: body.timeEnd || null,
        notes: body.notes || null,
        createdById: dbUser?.id || userId,
        createdByName: dbUser?.name || req.user.email,
      },
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    // Actualización parcial: solo se cambian los campos que vienen en el body
    // (al arrastrar un evento a otro día solo llega { date })
    const data: any = {};
    if (body.date !== undefined) data.date = body.date;
    if (body.type !== undefined) data.type = body.type || 'otro';
    if (body.title !== undefined) data.title = body.title;
    for (const k of ['techId', 'techName', 'ticketId', 'ticketNum', 'ticketLabel', 'timeStart', 'timeEnd', 'notes']) {
      if (body[k] !== undefined) data[k] = body[k] || null;
    }
    return this.prisma.calendarEvent.update({ where: { id }, data });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.calendarEvent.delete({ where: { id } });
    return { deleted: true };
  }

  // ── ENVÍO DIARIO DE TAREAS VÍA WHATSAPP ────────────────────────
  // Llamar manualmente desde el panel (JWT) o por Railway cron con header x-cron-secret
  // Cron sugerido: 0 12 * * * (12:00 UTC = 07:00 Bogotá COT)
  @UseGuards(CronOrJwtGuard)
  @Post('send-daily')
  async sendDailyWhatsapp(@Request() req: any) {
    // Solo ADMIN (o cron con secret) puede disparar esto
    if (req.user?.role !== 'ADMIN') {
      return { sent: 0, error: 'No autorizado' };
    }
    return this.runDailySend();
  }

  // ── ENVÍO AUTOMÁTICO: lunes a viernes 7:00 a. m. hora Colombia ──
  @Cron('0 7 * * 1-5', { name: 'daily-tasks-whatsapp', timeZone: 'America/Bogota' })
  async dailyCron() {
    try {
      const r = await this.runDailySend();
      console.log('📅 Envío diario de tareas:', JSON.stringify(r));
    } catch (e: any) {
      console.error('📅 Error en envío diario de tareas:', e?.message);
    }
  }

  private async runDailySend() {
    const todayCol = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }); // "YYYY-MM-DD"
    const events = await this.withoutClosedTickets(await this.prisma.calendarEvent.findMany({
      where: { date: todayCol },
      orderBy: [{ timeStart: 'asc' }],
    }));

    if (!events.length) {
      return { sent: 0, date: todayCol, message: 'Sin eventos hoy' };
    }

    // Agrupar eventos por techId (técnico asignado)
    const byTech = new Map<string, { techId: string; techName: string; events: any[] }>();
    const noTech: any[] = [];

    for (const ev of events) {
      // Destinatarios: técnico del evento + técnicos de apoyo del ticket
      const recipients = [...new Set([ev.techId, ...(ev.supportTechIds || [])].filter(Boolean))] as string[];
      if (!recipients.length) { noTech.push(ev); continue; }
      for (const tid of recipients) {
        if (!byTech.has(tid)) {
          byTech.set(tid, { techId: tid, techName: tid === ev.techId ? (ev.techName || '') : '', events: [] });
        }
        byTech.get(tid)!.events.push(ev);
      }
    }

    // Cargar teléfonos (y nombres) de los técnicos
    const techIds = [...byTech.keys()];
    const users = techIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: techIds }, isActive: true },
          select: { id: true, name: true, phone: true },
        })
      : [];
    for (const u of users as any[]) {
      const g = byTech.get(u.id);
      if (g && !g.techName) g.techName = u.name || '';
    }

    const phoneMap = new Map(users.map((u: any) => [u.id, u.phone]));

    // Formatear fecha en español
    const [y, m, d] = todayCol.split('-');
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const fechaStr = `${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y}`;

    let sent = 0;
    const results: any[] = [];

    for (const [techId, group] of byTech) {
      const phone = phoneMap.get(techId) as string | undefined;
      if (!phone) {
        results.push({ techId, techName: group.techName, skipped: 'sin teléfono' });
        continue;
      }

      const lines = group.events.map((ev, i) => {
        const hora = ev.timeStart ? ` (${ev.timeStart}${ev.timeEnd ? '–' + ev.timeEnd : ''})` : '';
        const ticket = ev.ticketNum ? ` #${ev.ticketNum}` : '';
        return `${i + 1}.${ticket} ${ev.title || '–'}${hora}`;
      });

      const msg =
        `📅 *Gipfel IT — Tareas del día*\n` +
        `Hola ${group.techName.split(' ')[0]} 👋\n` +
        `Estas son tus tareas para hoy *${fechaStr}*:\n\n` +
        lines.join('\n') +
        `\n\n🔗 Panel: https://grupogipfel.com/gipfel.html`;

      await sendWhatsapp(phone, msg);
      sent++;
      results.push({ techId, techName: group.techName, phone: '***' + phone.slice(-4), tasks: group.events.length });
    }

    return { sent, date: todayCol, results };
  }

  // ── PREVIEW del mensaje (sin enviar) ────────────────────────────
  @Get('daily-preview')
  async dailyPreview(@Request() req: any) {
    if (req.user?.role !== 'ADMIN') return { error: 'No autorizado' };
    const todayCol = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const events = await this.withoutClosedTickets(await this.prisma.calendarEvent.findMany({
      where: { date: todayCol },
      orderBy: [{ timeStart: 'asc' }],
    }));
    const techIds = [...new Set(events.flatMap((e: any) => [e.techId, ...(e.supportTechIds || [])]).filter(Boolean) as string[])];
    const users = techIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: techIds } },
          select: { id: true, name: true, phone: true },
        })
      : [];
    return {
      date: todayCol,
      totalEvents: events.length,
      technicians: users.map((u: any) => ({
        name: u.name,
        hasPhone: !!u.phone,
        tasks: events.filter((e: any) => e.techId === u.id || (e.supportTechIds || []).includes(u.id)).map(e => ({ title: e.title, time: e.timeStart, ticket: e.ticketNum })),
      })),
      waConfigured: !!(process.env.WA_SERVICE_URL || (process.env.WA_PHONE_NUMBER_ID && process.env.WA_ACCESS_TOKEN)),
    };
  }
}
