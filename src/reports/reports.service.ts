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
    return `RPT-${year}-${String(count+1).padStart(4,'0')}`;
  }

  async findAll(query: any) {
    const where: any = {};
    if (query.clientId) where.clientId = query.clientId;
    if (query.serviceType) where.serviceType = query.serviceType;
    if (query.search) where.OR = [{ reportNumber: { contains: query.search, mode: 'insensitive' } }, { description: { contains: query.search, mode: 'insensitive' } }];
    const { skip, take } = paginate(query.page, query.limit);
    const [data, total] = await Promise.all([
      this.prisma.serviceReport.findMany({ where, skip, take, include: { client: true, technician: { select: { id: true, name: true } }, assets: { include: { asset: { include: { assetType: true } } } } }, orderBy: { createdAt: 'desc' } }),
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
    const report = await this.prisma.serviceReport.create({
      data: {
        reportNumber, clientId: dto.clientId, technicianId: dto.technicianId||undefined,
        date: new Date(dto.date), serviceType: dto.serviceType, description: dto.description,
        observations: dto.observations, conclusion: dto.conclusion, timeUsed: dto.timeUsed, signatureUrl: dto.signatureUrl,
        assets: dto.assetIds?.length ? { create: dto.assetIds.map((a: any) => ({ assetId: typeof a==='string'?a:a.id, workDetail: typeof a==='object'?a.workDetail:undefined })) } : undefined,
      },
      include: { client: true, technician: { select: { id: true, name: true } }, assets: { include: { asset: true } } },
    });
    if (dto.assetIds?.length) {
      for (const a of dto.assetIds) {
        const assetId = typeof a==='string'?a:a.id;
        const workDetail = typeof a==='object'?a.workDetail:dto.description;
        await this.prisma.maintenanceRecord.create({ data: { assetId, technicianId: dto.technicianId||undefined, date: new Date(dto.date), type: 'CORRECTIVO', description: dto.description, workDone: workDetail||dto.description, reportId: report.id } });
      }
    }
    return report;
  }

  async saveSignature(id: string, signatureUrl: string) { return this.prisma.serviceReport.update({ where: { id }, data: { signatureUrl } }); }

  buildHtml(r: any): string {
    const assetRows = (r.assets||[]).map((ra: any) =>
      `<tr><td>${ra.asset?.code||'–'}</td><td>${ra.asset?.name||'–'}</td><td>${ra.asset?.serial||'–'}</td><td>${ra.workDetail||ra.asset?.assetType?.name||'–'}</td></tr>`
    ).join('');
    const dateStr = new Date(r.date).toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric'});
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
*{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:32px;color:#1e293b;font-size:12px;margin:0}
.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:4px solid #1d4ed8;padding-bottom:16px;margin-bottom:20px}
.logo-box{display:flex;align-items:center;gap:12px}.logo-text{font-size:24px;font-weight:900;color:#1d4ed8;letter-spacing:-1px}
.logo-sub{font-size:10px;color:#64748b;margin-top:2px}
.report-num{font-size:20px;font-weight:700;color:#1d4ed8}.report-label{font-size:10px;color:#64748b;text-align:right}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;background:#f8fafc;padding:14px;border-radius:8px}
.field label{font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#64748b;display:block;margin-bottom:3px}
.field span{font-weight:600;font-size:12px}
h3{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#1d4ed8;margin:16px 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
.desc{background:#f8fafc;padding:12px;border-radius:6px;line-height:1.7;border-left:3px solid #1d4ed8}
table{width:100%;border-collapse:collapse;margin-top:8px;font-size:11px}
th{background:#1d4ed8;color:#fff;padding:7px 10px;text-align:left}
td{padding:6px 10px;border-bottom:1px solid #e2e8f0}tr:nth-child(even) td{background:#f8fafc}
.sig-section{margin-top:40px;display:flex;justify-content:flex-end}
.sig-box{text-align:center;min-width:220px}
.sig-img{max-width:200px;max-height:80px;display:block;margin:0 auto 8px;border-bottom:2px solid #1d4ed8;padding-bottom:6px}
.sig-name{font-size:11px;font-weight:600;color:#1e293b}.sig-role{font-size:10px;color:#64748b}
.footer{margin-top:30px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}
</style></head><body>
<div class="header">
  <div class="logo-box">
    <div><div class="logo-text">GIPFEL IT</div><div class="logo-sub">Soporte Tecnológico Empresarial<br>soporte@grupogipfel.com · www.grupogipfel.com</div></div>
  </div>
  <div style="text-align:right"><div class="report-num">${r.reportNumber}</div><div class="report-label">Reporte de Servicio Técnico</div></div>
</div>
<div class="grid2">
  <div class="field"><label>Cliente</label><span>${r.client?.businessName||'–'}</span></div>
  <div class="field"><label>Fecha</label><span>${dateStr}</span></div>
  <div class="field"><label>Técnico responsable</label><span>${r.technician?.name||'–'}</span></div>
  <div class="field"><label>Tipo de servicio</label><span>${r.serviceType?.replace(/_/g,' ')||'–'}</span></div>
  <div class="field"><label>Tiempo utilizado</label><span>${r.timeUsed||'–'} horas</span></div>
  <div class="field"><label>Contacto cliente</label><span>${r.client?.contactName||r.client?.email||'–'}</span></div>
</div>
<h3>Descripción del servicio</h3>
<div class="desc">${r.description}</div>
${r.observations?`<h3>Observaciones</h3><div class="desc">${r.observations}</div>`:''}
${r.conclusion?`<h3>Conclusión</h3><div class="desc">${r.conclusion}</div>`:''}
${assetRows?`<h3>Equipos intervenidos</h3><table><thead><tr><th>Código</th><th>Equipo</th><th>Serial</th><th>Trabajo realizado</th></tr></thead><tbody>${assetRows}</tbody></table>`:''}
${r.signatureUrl?`<div class="sig-section"><div class="sig-box"><img class="sig-img" src="${r.signatureUrl}" alt="Firma digital"><div class="sig-name">${r.client?.contactName||r.client?.businessName||'Cliente'}</div><div class="sig-role">Firma de conformidad</div></div></div>`:''}
<div class="footer"><span>Gipfel IT — NIT: —</span><span>Documento generado el ${new Date().toLocaleDateString('es-CO')}</span><span>${r.reportNumber}</span></div>
</body></html>`;
  }

  async sendByEmail(id: string) {
    const r = await this.findOne(id);
    if (!r.client.email) throw new NotFoundException('El cliente no tiene correo registrado');
    const isPort465 = Number(process.env.SMTP_PORT||'465') === 465;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST||'mail.grupogipfel.com',
      port: Number(process.env.SMTP_PORT||'465'),
      secure: isPort465,
      auth: { user: process.env.SMTP_USER||'soporte@grupogipfel.com', pass: process.env.SMTP_PASS },
      tls: { rejectUnauthorized: false },
    });
    const html = this.buildHtml(r);
    await transporter.sendMail({
      from: `"Gipfel IT" <${process.env.SMTP_FROM||process.env.SMTP_USER||'soporte@grupogipfel.com'}>`,
      to: r.client.email,
      subject: `Reporte de Servicio ${r.reportNumber} — Gipfel IT`,
      html,
      attachments: [{ filename: `${r.reportNumber}.html`, content: html, contentType: 'text/html' }],
    });
    await this.prisma.serviceReport.update({ where: { id }, data: { sentAt: new Date() } });
    return { success: true, sentTo: r.client.email };
  }
}
