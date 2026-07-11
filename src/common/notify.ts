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

async function sendWhatsapp(phone: string, apiKey: string, text: string) {
  if (!phone || !apiKey) return;
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
