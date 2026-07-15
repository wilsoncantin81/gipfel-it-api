"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyTicketAssigned = notifyTicketAssigned;
const nodemailer = require("nodemailer");
function getTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    if (!host)
        return null;
    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
}
async function sendEmail(to, subject, html) {
    const transporter = getTransporter();
    if (!transporter || !to)
        return;
    try {
        await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html });
    }
    catch (e) {
        console.error('sendEmail error:', e?.message);
    }
}
async function sendWhatsapp(phone, apiKey, text) {
    if (!phone || !apiKey)
        return;
    try {
        const clean = phone.replace(/[^0-9+]/g, '');
        const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(clean)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apiKey)}`;
        await fetch(url);
    }
    catch (e) {
        console.error('sendWhatsapp error:', e?.message);
    }
}
async function notifyTicketAssigned(prisma, ticketId) {
    try {
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { client: true, assignedTo: true },
        });
        const tech = ticket?.assignedTo;
        if (!ticket || !tech)
            return;
        const clientName = ticket.client?.businessName || '';
        const msg = `Gipfel IT: se te asignó el ticket ${ticket.ticketNumber} (${clientName}). ${ticket.title}`;
        await Promise.all([
            sendEmail(tech.email, `Nuevo ticket asignado: ${ticket.ticketNumber}`, `<p>${msg}</p><p>Ingresa al panel para ver el detalle.</p>`),
            sendWhatsapp(tech.phone, tech.whatsappApiKey, msg),
        ]);
    }
    catch (e) {
        console.error('notifyTicketAssigned error:', e?.message);
    }
}
//# sourceMappingURL=notify.js.map