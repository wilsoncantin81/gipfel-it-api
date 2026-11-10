import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../common/prisma.service';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('ai')
export class AiController {
  constructor(private readonly prisma: PrismaService) {}

  private async callClaude(system: string, userMsg: string, history: Array<{role:string;content:string}> = [], maxTokens = 600): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('Servicio de IA no configurado (ANTHROPIC_API_KEY)');

    const messages = [
      ...history.slice(-6),
      { role: 'user', content: userMsg },
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: maxTokens,
        system,
        messages,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`IA no disponible (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  }

  @Post('improve-text')
  async improveText(@Body() body: { text: string; context?: string; type?: string }) {
    const { text, context, type } = body;
    const system = 'Eres un asistente técnico profesional de soporte informático de Grupo Gipfel. Mejoras textos de reportes de servicio técnico. Responde SOLO con el texto mejorado, sin explicaciones, en español, máximo 3 oraciones.';
    const userMsg = `Mejora este texto de forma profesional, clara y concisa.\n${type ? `Tipo: ${type}\n` : ''}${context ? `Contexto: ${context}\n` : ''}Texto: ${text}`;

    const improved = await this.callClaude(system, userMsg, [], 500);
    return { improved: improved || text };
  }

  @Post('chat')
  async chat(@Body() body: { message: string; history?: Array<{role: string; content: string}> }, @Request() req: any) {
    const { message, history = [] } = body;

    // Gather rich context from DB
    let contextData = '';
    try {
      const [clients, ticketStats, recentTickets, recentAssets, technicians] = await Promise.all([
        this.prisma.client.findMany({ where: { status: 'ACTIVO' }, select: { id: true, businessName: true }, orderBy: { businessName: 'asc' }, take: 50 }),
        this.prisma.ticket.groupBy({ by: ['status'], _count: { id: true } }),
        this.prisma.ticket.findMany({
          where: { status: { not: 'CERRADO' } },
          select: { id: true, ticketNumber: true, title: true, status: true, priority: true,
            client: { select: { businessName: true } },
            assignedTo: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        this.prisma.asset.findMany({
          where: { status: 'ACTIVO' },
          select: { id: true, code: true, name: true, client: { select: { businessName: true } } },
          orderBy: { updatedAt: 'desc' },
          take: 30,
        }),
        this.prisma.user.findMany({
          where: { role: { in: ['TECNICO', 'ADMIN'] }, isActive: true },
          select: { id: true, name: true },
        }),
      ]);
      const clientList = clients.map((c: any) => `${c.businessName} (ID:${c.id})`).join(' | ');
      const statusSummary = ticketStats.map((s: any) => `${s.status}:${s._count.id}`).join(', ');
      const ticketList = recentTickets.map((t: any) =>
        `[${t.ticketNumber}] ${t.title} — ${t.client?.businessName || '?'} — ${t.status} — Técnico: ${t.assignedTo?.name || 'sin asignar'}`
      ).join('\n');
      const assetList = recentAssets.map((a: any) => `[${a.code}] ${a.name} — ${a.client?.businessName || '?'} (ID:${a.id})`).join('\n');
      const techList = technicians.map((u: any) => `${u.name} (ID:${u.id})`).join(', ');
      contextData = `
CLIENTES ACTIVOS: ${clientList}
TÉCNICOS: ${techList}
TICKETS ABIERTOS (${recentTickets.length}):
${ticketList}
RESUMEN ESTADOS: ${statusSummary}
ACTIVOS RECIENTES:
${assetList}`;
    } catch (e) { /* continue without context */ }

    const system = `Eres el asistente de IA de Gipfel IT Manager, sistema de gestión de activos tecnológicos de Grupo Gipfel. Ayudas al equipo técnico. Eres conciso, útil y respondes siempre en español.

ACCIONES DISPONIBLES — cuando el usuario pida alguna de estas, responde ÚNICAMENTE con el JSON correspondiente, sin texto adicional:

Crear ticket: {"action":"create_ticket","clientName":"...","title":"..."} — Solo clientName y title son obligatorios. description y priority son opcionales (priority por defecto MEDIA). NO pidas más datos al usuario, crea el ticket con lo que te dé.
Crear reporte: {"action":"create_report","clientName":"...","description":"..."}
Cambiar estado ticket: {"action":"change_ticket_status","ticketNumber":"TK-XXX","status":"NUEVO|EN_EJECUCION|POR_CONFIRMACION|PENDIENTE_WILSON|POR_FACTURACION|PENDIENTE_POR_PAGO|CERRADO"}
Asignar técnico: {"action":"assign_ticket","ticketNumber":"TK-XXX","techName":"nombre del técnico"}
Buscar activos de un cliente: {"action":"search_assets","clientName":"..."}
Ver tickets de un cliente: {"action":"search_tickets","clientName":"..."}
Abrir ticket: {"action":"open_ticket","ticketNumber":"TK-XXX"}
Abrir activo: {"action":"open_asset","assetCode":"XXX"}

Para cualquier consulta o pregunta, responde en texto normal en español, breve y directo.

DATOS DEL SISTEMA:${contextData}`;

    const reply = await this.callClaude(system, message, history);
    return { reply: reply || 'No pude procesar tu solicitud.' };
  }
}
