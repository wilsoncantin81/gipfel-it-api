import * as nodemailer from 'nodemailer';
import { PrismaService } from './prisma.service';

function getTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    if (!host) return null;
    return nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
}

async function sendEmail(to: string, subject: string, html: string) {
    const transporter = getTransporter();
    if (!transporter || !to) return;
    try {
          await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html });
    } catch (e: any) {
          console.error('sendEmail error:', e?.message);
    }
}

// ── WhatsApp vía Meta Cloud API ────────────────────────────────────
// Variables de entorno requeridas:
//   WA_PHONE_NUMBER_ID  → ID del número de WhatsApp Business en Meta
//   WA_ACCESS_TOKEN     → Token de acceso permanente de la app de Meta
//
// El número destino debe estar en formato internacional sin +  (ej: 573115035734)
export async function sendWhatsappMeta(toPhone: string, text: string): Promise<void> {
    const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
    const token = process.env.WA_ACCESS_TOKEN;
    if (!phoneNumberId || !token) {
          console.warn('WhatsApp Meta no configurado (WA_PHONE_NUMBER_ID / WA_ACCESS_TOKEN)');
          return;
    }
    if (!toPhone) return;
    // Limpiar número: solo dígitos, sin + ni espacios
    const clean = toPhone.replace(/[^0-9]/g, '');
    if (!clean || clean.length < 7) return;

    try {
          const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
          const body = {
                to: clean,
                type: 'text',
                messaging_product: 'whatsapp',
                text: { body: text },
          };
          const res = await fetch(url, {
                method: 'POST',
                headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
          });
          if (!res.ok) {
                const err = await res.text();
                console.error('WhatsApp Meta error:', res.status, err);
          }
    } catch (e: any) {
          console.error('sendWhatsappMeta error:', e?.message);
    }
}

// Legacy CallMeBot — se mantiene para compatibilidad pero ya no se usa
async function sendWhatsapp(phone: string, apiKey: string, text: string) {
    if (!phone || !apiKey) return;
    // Preferir Meta si está configurado
    if (process.env.WA_PHONE_NUMBER_ID && process.env.WA_ACCESS_TOKEN) {
          return sendWhatsappMeta(phone, text);
    }
    try {
          const clean = phone.replace(/[^0-9+]/g, '');
          const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(clean)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apiKey)}`;
          await fetch(url);
    } catch (e: any) {
          console.error('sendWhatsapp error:', e?.message);
    }
}

export async function notifyTicketAssigned(prisma: PrismaService, ticketId: string) {
    try {
          const ticket: any = await prisma.ticket.findUnique({
                  where: { id: ticketId },
                  include: { client: true, assignedTo: true },
          });
          const tech = ticket?.assignedTo;
          if (!ticket || !tech) return;
          const clientName = ticket.client?.businessName || '';
          const msg = `Gipfel IT: se te asignó el ticket ${ticket.ticketNumber} (${clientName}). ${ticket.title}`;
          await Promise.all([
                  sendEmail(tech.email, `Nuevo ticket asignado: ${ticket.ticketNumber}`, `<p>${msg}</p><p>Ingresa al panel para ver el detalle.</p>`),
                  sendWhatsapp(tech.phone, tech.whatsappApiKey, msg),
                ]);
    } catch (e: any) {
          console.error('notifyTicketAssigned error:', e?.message);
    }
}

export async function notifyNewTicket(prisma: PrismaService, ticketId: string) {
    try {
          const ticket: any = await prisma.ticket.findUnique({
                  where: { id: ticketId },
                  include: { client: true },
          });
          if (!ticket) return;
          const admins = await (prisma as any).user.findMany({ where: { role: 'ADMIN', isActive: true } });
          const clientName = ticket.client?.businessName || '';
          const msg = `Gipfel IT: nuevo ticket ${ticket.ticketNumber} de ${clientName}. ${ticket.title}`;
          await Promise.all(
                  admins.map((admin: any) => Promise.all([
                            sendEmail(admin.email, `Nuevo ticket: ${ticket.ticketNumber}`, `<p>${msg}</p><p>Ingresa al panel para ver el detalle.</p>`),
                            sendWhatsapp(admin.phone, admin.whatsappApiKey, msg),
                          ]))
                );
    } catch (e: any) {
          console.error('notifyNewTicket error:', e?.message);
    }
}
