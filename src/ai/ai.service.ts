import { Injectable } from '@nestjs/common';

@Injectable()
    export class AiService {
      async improveText(text: string, context?: string, type?: string): Promise<{ improved: string }> {
                  if (!text || !text.trim()) return { improved: text };
                  const apiKey = process.env.GEMINI_API_KEY;
                  if (!apiKey) {
                                      console.error('GEMINI_API_KEY no configurada');
                                      throw new Error('Servicio de IA no configurado');
                  }
                  const prompt = `Mejora la redacción del siguiente texto de un ${type || 'reporte técnico'} para que sea claro, profesional y conciso, en español. No agregues información que no esté presente en el texto original. Responde únicamente con el texto mejorado, sin comentarios ni comillas adicionales.\n\n${context ? `Contexto: ${context}\n\n` : ''}Texto original:\n${text}`;
                  const maxRetries = 2;
                  for (let attempt = 1; attempt <= maxRetries; attempt++) {
                                      const controller = new AbortController();
                                      const timeoutId = setTimeout(() => controller.abort(), 12000);
                                      try {
                                                                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent`,
                                                                        {
                                                                            method: 'POST',
                                                                                                                    headers: { 'x-goog-api-key': apiKey, 'content-type': 'application/json' },
                                                                                                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { thinkingConfig: { thinkingBudget: 0 } } }),
                                                                                                                    signal: controller.signal,
                                                                        },
                                                                                                            );
                                                                    clearTimeout(timeoutId);
                                                                    if (!response.ok) {
                                                                                                              const err = await response.text();
                                                                                                              console.error(`Error de Gemini API (intento ${attempt}/${maxRetries}):`, err);
                                                                                                              if (response.status === 503 && attempt < maxRetries) {
                                                                                                                                                                      await new Promise((r) => setTimeout(r, 1000 * attempt));
                                                                                                                                                                      continue;
                                                                                                                }
                                                                                                              throw new Error('No se pudo mejorar el texto con IA');
                                                                    }
                                                                    const data: any = await response.json();
                                                                    const improved = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                                                                    return { improved: improved || text };
                                      } catch (e: any) {
                                                                    clearTimeout(timeoutId);
                                                                    if (e?.name === 'AbortError') console.error(`Gemini API timeout (intento ${attempt}/${maxRetries})`);
                                                                    if (attempt === maxRetries) {
                                                                                                              console.error('AI improve-text error:', e);
                                                                                                              throw new Error('No se pudo mejorar el texto con IA');
                                                                    }
                                      }
                  }
                  return { improved: text };
      }
}
