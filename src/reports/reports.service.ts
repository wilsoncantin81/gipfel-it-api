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
        reportNumber,
        clientId: dto.clientId,
        technicianId: dto.technicianId||undefined,
        date: new Date(dto.date),
        serviceType: dto.serviceType,
        description: dto.description,
        observations: dto.observations,
        conclusion: dto.conclusion,
        timeUsed: dto.timeUsed,
        signatureUrl: dto.signatureUrl,
        assets: dto.assetIds?.length ? { create: dto.assetIds.map((a: any) => ({ assetId: typeof a === 'string' ? a : a.id, workDetail: typeof a === 'object' ? a.workDetail : undefined })) } : undefined,
      },
      include: { client: true, technician: { select: { id: true, name: true } }, assets: { include: { asset: true } } },
    });

    // Register maintenance record for each asset
    if (dto.assetIds?.length && dto.technicianId) {
      for (const a of dto.assetIds) {
        const assetId = typeof a === 'string' ? a : a.id;
        const workDetail = typeof a === 'object' ? a.workDetail : dto.description;
        await this.prisma.maintenanceRecord.create({
          data: {
            assetId,
            technicianId: dto.technicianId||undefined,
            date: new Date(dto.date),
            type: 'CORRECTIVO',
            description: dto.description,
            workDone: workDetail||dto.description,
            reportId: report.id,
          },
        });
      }
    }
    return report;
  }

  async saveSignature(id: string, signatureUrl: string) {
    return this.prisma.serviceReport.update({ where: { id }, data: { signatureUrl } });
  }

  buildHtml(r: any): string {
    const assetRows = (r.assets||[]).map((ra: any) =>
      `<tr><td style="padding:6px 10px;border-bottom:1px solid #e2e8f0">${ra.asset?.code||'–'}</td><td style="padding:6px 10px;border-bottom:1px solid #e2e8f0">${ra.asset?.name||'–'}</td><td style="padding:6px 10px;border-bottom:1px solid #e2e8f0">${ra.asset?.serial||'–'}</td><td style="padding:6px 10px;border-bottom:1px solid #e2e8f0">${ra.workDetail||'–'}</td></tr>`
    ).join('');

    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>body{font-family:Arial,sans-serif;padding:32px;color:#1e293b;font-size:13px}
.header{display:flex;justify-content:space-between;border-bottom:3px solid #1d4ed8;padding-bottom:16px;margin-bottom:20px}
.logo{font-size:22px;font-weight:900;color:#1d4ed8}h3{color:#1d4ed8;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
.field{font-size:12px}.field label{color:#64748b;display:block;margin-bottom:2px}
table{width:100%;border-collapse:collapse}th{background:#1d4ed8;color:#fff;padding:7px 10px;text-align:left;font-size:12px}
.sig{margin-top:40px;text-align:right}.sig img{max-width:200px;display:block;margin:0 auto 6px}
.sig-line{border-top:1px solid #94a3b8;padding-top:6px;font-size:11px;color:#64748b}
</style></head><body>
<div class="header">
  <div><div class="logo">GIPFEL IT</div><div style="font-size:11px;color:#64748b">Soporte Tecnológico Empresarial</div></div>
  <div style="text-align:right"><div style="font-size:18px;font-weight:700;color:#1d4ed8">${r.reportNumber}</div><div style="font-size:11px;color:#64748b">Reporte de Servicio</div></div>
</div>
<div class="grid">
  <div class="field"><label>Cliente</label><strong>${r.client?.businessName||'–'}</strong></div>
  <div class="field"><label>Fecha</label>${new Date(r.date).toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric'})}</div>
  <div class="field"><label>Técnico</label>${r.technician?.name||'–'}</div>
  <div class="field"><label>Tipo de servicio</label>${r.serviceType?.replace(/_/g,' ')||'–'}</div>
  <div class="field"><label>Tiempo utilizado</label>${r.timeUsed||'–'} horas</div>
</div>
<h3>Descripción del servicio</h3>
<p style="background:#f8fafc;padding:12px;border-radius:6px;line-height:1.6">${r.description}</p>
${r.observations?`<h3>Observaciones</h3><p style="background:#f8fafc;padding:12px;border-radius:6px;line-height:1.6">${r.observations}</p>`:''}
${r.conclusion?`<h3>Conclusión</h3><p style="background:#f8fafc;padding:12px;border-radius:6px;line-height:1.6">${r.conclusion}</p>`:''}
${assetRows?`<h3>Equipos intervenidos</h3><table><thead><tr><th>Código</th><th>Equipo</th><th>Serial</th><th>Trabajo realizado</th></tr></thead><tbody>${assetRows}</tbody></table>`:''}
${r.signatureUrl?`<div class="sig"><img src="${r.signatureUrl}"><div class="sig-line">Firma de conformidad — ${r.client?.contactName||r.client?.businessName||'Cliente'}</div></div>`:''}
</body></html>`;
  }

  async sendByEmail(id: string) {
    const r = await this.findOne(id);
    if (!r.client.email) throw new NotFoundException('El cliente no tiene correo registrado');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST||'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT)||587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      tls: { rejectUnauthorized: false },
    });

    const html = this.buildHtml(r);

    await transporter.sendMail({
      from: `"Gipfel IT" <${process.env.SMTP_FROM||process.env.SMTP_USER}>`,
      to: r.client.email,
      subject: `Reporte de Servicio ${r.reportNumber} — Gipfel IT`,
      html,
    });

    await this.prisma.serviceReport.update({ where: { id }, data: { sentAt: new Date() } });
    return { success: true, sentTo: r.client.email };
  }
}
