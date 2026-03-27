import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { paginate } from '../common/pagination.dto';
import * as nodemailer from 'nodemailer';
@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}
  private async nextNumber() {
    const year = new Date().getFullYear();
    const count = await this.prisma.serviceReport.count();
    return `RPT-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  async findAll(query: any) {
    const where: any = {};
    if (query.clientId) where.clientId = query.clientId;
    if (query.serviceType) where.serviceType = query.serviceType;
    if (query.search) where.OR = [{ reportNumber: { contains: query.search, mode: 'insensitive' } }];
    const { skip, take } = paginate(query.page, query.limit);
    const [data, total] = await Promise.all([
      this.prisma.serviceReport.findMany({ where, skip, take, include: { client: true, technician: { select: { id: true, name: true } }, assets: { include: { asset: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.serviceReport.count({ where }),
    ]);
    return { data, total };
  }
  async findOne(id: string) {
    const r = await this.prisma.serviceReport.findUnique({ where: { id }, include: { client: true, technician: { select: { id: true, name: true } }, assets: { include: { asset: { include: { assetType: true } } } } } });
    if (!r) throw new NotFoundException('Reporte no encontrado');
    return r;
  }
  async create(dto: any) {
    const reportNumber = await this.nextNumber();
    return this.prisma.serviceReport.create({
      data: { reportNumber, clientId: dto.clientId, technicianId: dto.technicianId || undefined, date: new Date(dto.date), serviceType: dto.serviceType, description: dto.description, observations: dto.observations, timeUsed: dto.timeUsed, signatureUrl: dto.signatureUrl, assets: dto.assetIds?.length ? { create: dto.assetIds.map((assetId: string) => ({ assetId })) } : undefined },
      include: { client: true, technician: { select: { id: true, name: true } }, assets: { include: { asset: true } } },
    });
  }
  async saveSignature(id: string, signatureUrl: string) { return this.prisma.serviceReport.update({ where: { id }, data: { signatureUrl } }); }
  buildHtml(r: any): string {
    const assetRows = (r.assets || []).map((ra: any) => `<tr><td style="padding:6px 10px;border-bottom:1px solid #e2e8f0">${ra.asset?.name||'–'}</td><td style="padding:6px 10px;border-bottom:1px solid #e2e8f0">${ra.asset?.serial||'–'}</td></tr>`).join('');
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;padding:32px;color:#1e293b;font-size:12px}h2{color:#1d4ed8;border-bottom:2px solid #1d4ed8;padding-bottom:8px}table{width:100%;border-collapse:collapse}th{background:#1d4ed8;color:#fff;padding:7px 10px;text-align:left}</style></head><body>
    <h2>GIPFEL IT — Reporte de Servicio: ${r.reportNumber}</h2>
    <p><b>Cliente:</b> ${r.client?.businessName||'–'} | <b>Fecha:</b> ${new Date(r.date).toLocaleDateString('es-CO')} | <b>Técnico:</b> ${r.technician?.name||'–'} | <b>Tipo:</b> ${r.serviceType}</p>
    <h3>Equipos intervenidos</h3><table><thead><tr><th>Nombre</th><th>Serial</th></tr></thead><tbody>${assetRows}</tbody></table>
    <h3>Descripción</h3><p>${r.description}</p>${r.observations?`<p><b>Observaciones:</b> ${r.observations}</p>`:''}
    <p><b>Tiempo utilizado:</b> ${r.timeUsed||'–'} horas</p>
    ${r.signatureUrl?`<div style="margin-top:30px;text-align:right"><img src="${r.signatureUrl}" style="max-width:180px"><br><small>Firma del cliente</small></div>`:''}
    </body></html>`;
  }
  async sendByEmail(id: string) {
    const r = await this.findOne(id);
    if (!r.client.email) return { success: false, error: 'Cliente sin correo' };
    const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST||'smtp.gmail.com', port: Number(process.env.SMTP_PORT)||587, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    await transporter.sendMail({ from: `"Gipfel IT" <${process.env.SMTP_FROM}>`, to: r.client.email, subject: `Reporte ${r.reportNumber} — Gipfel IT`, html: this.buildHtml(r) });
    await this.prisma.serviceReport.update({ where: { id }, data: { sentAt: new Date() } });
    return { success: true, sentTo: r.client.email };
  }
}
