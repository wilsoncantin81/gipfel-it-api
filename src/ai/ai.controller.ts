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

  @Post('improve-text')
  async improveText(@Body() body: { text: string; context?: string; type?: string }) {
    const { text, context, type } = body;
    const prompt = `Eres un asistente técnico de soporte informático de Grupo Gipfel. Mejora y redacta de forma profesional, clara y concisa el siguiente texto de un reporte de servicio técnico.\n\n${type ? `Tipo de servicio: ${type}` : ''}\n${context ? `Contexto: ${context}` : ''}\nTexto original: ${text}\n\nResponde SOLO con el texto mejorado, sin explicaciones, en español, máximo 3 oraciones.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 500,
        messages: [
          { role: 'system', content: 'Eres un asistente técnico profesional de soporte informático.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`OpenAI error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    return { improved: data.choices?.[0]?.message?.content || text };
  }

  @Post('chat')
  async chat(@Body() body: { message: string; history?: Array<{role: string; content: string}> }, @Request() req: any) {
    const { message, history = [] } = body;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('Servicio de IA no configurado');

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

    const systemMsg = `Eres el asistente de IA de Gipfel IT Manager, el sistema de gestión de activos tecnológicos de Grupo Gipfel. Ayudas al equipo técnico de soporte informático. Puedes responder preguntas, resumir información y guiar al usuario para crear tickets o reportes.

Cuando el usuario quiera crear un ticket, responde con un JSON así (nada más): {"action":"create_ticket","clientName":"nombre del cliente","title":"título del ticket","description":"descripción","priority":"MEDIA"}
Cuando quiera crear un reporte, responde con: {"action":"create_report","clientName":"nombre del cliente","description":"descripción del servicio"}
Para cualquier otra respuesta, responde en español, de forma breve y útil.

Datos actuales del sistema:${contextData}`;

    const messages = [
      { role: 'system', content: systemMsg },
      ...history.slice(-6),
      { role: 'user', content: message },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 600, messages }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`IA no disponible (${response.status})`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'No pude procesar tu solicitud.';
    return { reply };
  }
}
