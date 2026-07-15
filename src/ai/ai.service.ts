import { Injectable } from '@nestjs/common';

@Injectable()
  export class AiService {
  async improveText(text: string, context?: string, type?: string): Promise<{ improved: string }> {
    if (!text || !text.trim()) return { improved: text };
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY no configurada');
      throw new Error('Servicio de IA no configurado');
    }
    const prompt = `Mejora la redacción del siguiente texto de un ${type || 'reporte técnico'} para que sea claro, profesional y conciso, en español. No agregues información que no esté presente en el texto original. Responde Únicamente con el texto mejorado, sin comentarios ni comillas adicionales.\n\n${context ? `Contexto: ${context}\n\n` : ''}Texto original:\n${text}`;
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!response.ok) {
        const err = await response.text();
        console.error('Error de Anthropic API:', err);
        throw new Error('No se pudo mejorar el texto con IA');
      }
      const data: any = await response.json();
      const improved = data?.content?.[0]?.text?.trim();
      return { improved: improved || text };
    } catch (e) {
      console.error('AI improve-text error:', e);
      throw e;
    }
  }
}
