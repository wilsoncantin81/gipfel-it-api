import {
  Controller, Get, Post, Put, Delete,
  Param, Body, UseGuards, Request, Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../common/prisma.service';
import { sendWhatsappMeta } from '../common/notify';
import { CronOrJwtGuard } from '../auth/cron-or-jwt.guard';

@ApiTags('Calendar')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('calendar')
export class CalendarController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll(@Query('month') month?: string, @Query('year') year?: string) {
    const where: any = {};
    if (month && year) {
      // Filter by month/year prefix: "2026-10"
      const prefix = `${year}-${month.padStart(2, '0')}`;
      where.date = { startsWith: prefix };
    }
    return this.prisma.calendarEvent.findMany({
      where,
      orderBy: [{ date: 'asc' }, { timeStart: 'asc' }],
    });
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
    return this.prisma.calendarEvent.update({
      where: { id },
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
      },
    });
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

    const todayCol = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }); // "YYYY-MM-DD"
    const events = await this.prisma.calendarEvent.findMany({
      where: { date: todayCol },
      orderBy: [{ timeStart: 'asc' }],
    });

    if (!events.length) {
      return { sent: 0, date: todayCol, message: 'Sin eventos hoy' };
    }

    // Agrupar eventos por techId (técnico asignado)
    const byTech = new Map<string, { techId: string; techName: string; events: any[] }>();
    const noTech: any[] = [];

    for (const ev of events) {
      if (ev.techId) {
        if (!byTech.has(ev.techId)) {
          byTech.set(ev.techId, { techId: ev.techId, techName: ev.techName || '', events: [] });
        }
        byTech.get(ev.techId)!.events.push(ev);
      } else {
        noTech.push(ev);
      }
    }

    // Cargar teléfonos de los técnicos
    const techIds = [...byTech.keys()];
    const users = techIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: techIds }, isActive: true },
          select: { id: true, name: true, phone: true },
        })
      : [];

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
        `\n\n🔗 Panel: https://www.grupogipfel.com/app`;

      await sendWhatsappMeta(phone, msg);
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
    const events = await this.prisma.calendarEvent.findMany({
      where: { date: todayCol },
      orderBy: [{ timeStart: 'asc' }],
    });
    const techIds = [...new Set(events.filter(e => e.techId).map(e => e.techId as string))];
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
        tasks: events.filter(e => e.techId === u.id).map(e => ({ title: e.title, time: e.timeStart, ticket: e.ticketNum })),
      })),
      waConfigured: !!(process.env.WA_PHONE_NUMBER_ID && process.env.WA_ACCESS_TOKEN),
    };
  }
}
