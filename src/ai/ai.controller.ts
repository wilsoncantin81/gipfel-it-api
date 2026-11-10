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

    // Gather context from DB
    let contextData = '';
    try {
      const [clients, ticketStats, recentTickets] = await Promise.all([
        this.prisma.client.findMany({ where: { status: 'ACTIVO' }, select: { id: true, businessName: true }, take: 30 }),
        this.prisma.ticket.groupBy({ by: ['status'], _count: { id: true } }),
        this.prisma.ticket.findMany({
          where: { status: { not: 'CERRADO' } },
          select: { id: true, ticketNumber: true, title: true, status: true, priority: true, client: { select: { businessName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);
      const clientList = clients.map((c: any) => `${c.businessName} (ID:${c.id})`).join(', ');
      const statusSummary = ticketStats.map((s: any) => `${s.status}: ${s._count.id}`).join(', ');
      const openTicketsList = recentTickets.map((t: any) => `[${t.ticketNumber}] ${t.title} - ${t.client?.businessName || '?'} (${t.status})`).join('\n');
      contextData = `\nClientes activos: ${clientList}\nEstado de tickets: ${statusSummary}\nTickets abiertos recientes:\n${openTicketsList}`;
    } catch (e) { /* continue without context */ }

    const system = `Eres el asistente de IA de Gipfel IT Manager, sistema de gestión de activos tecnológicos de Grupo Gipfel. Ayudas al equipo técnico de soporte informático. Puedes responder preguntas, resumir información y guiar al usuario para crear tickets o reportes.

Cuando el usuario quiera crear un ticket, responde ÚNICAMENTE con este JSON (sin texto adicional): {"action":"create_ticket","clientName":"nombre del cliente","title":"título del ticket","description":"descripción","priority":"MEDIA"}
Cuando quiera crear un reporte, responde ÚNICAMENTE con: {"action":"create_report","clientName":"nombre del cliente","description":"descripción del servicio"}
Para cualquier otra respuesta, responde en español, de forma breve y útil.

Datos actuales del sistema:${contextData}`;

    const reply = await this.callClaude(system, message, history);
    return { reply: reply || 'No pude procesar tu solicitud.' };
  }
}
