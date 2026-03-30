import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { paginate } from '../common/pagination.dto';
import { encrypt, decrypt } from '../common/crypto.util';
import * as QRCode from 'qrcode';

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const where: any = {};
    if (query.search) where.OR = [{ name: { contains: query.search, mode: 'insensitive' } }, { serial: { contains: query.search, mode: 'insensitive' } }, { code: { contains: query.search, mode: 'insensitive' } }, { ipAddress: { contains: query.search } }];
    if (query.clientId) where.clientId = query.clientId;
    if (query.assetTypeId) where.assetTypeId = query.assetTypeId;
    if (query.status) where.status = query.status;
    const { skip, take } = paginate(query.page, query.limit);
    const [data, total] = await Promise.all([
      this.prisma.asset.findMany({ where, skip, take, include: { client: true, assetType: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.asset.count({ where }),
    ]);
    return { data: data.map(a => ({ ...a, passwordEnc: undefined })), total };
  }

  async findOne(id: string) {
    const a = await this.prisma.asset.findUnique({ where: { id }, include: { client: true, assetType: true, maintenanceRecords: { include: { technician: { select: { id: true, name: true } } }, orderBy: { date: 'desc' } }, attachments: true } });
    if (!a) throw new NotFoundException('Activo no encontrado');
    return { ...a, passwordEnc: undefined };
  }

  async create(dto: any) {
    const { password, ...rest } = dto;
    const passwordEnc = password ? encrypt(password) : undefined;
    if (!rest.code) { const count = await this.prisma.asset.count(); rest.code = `ACT-${String(count + 1).padStart(4, '0')}`; }
    const a = await this.prisma.asset.create({
      data: { ...rest, passwordEnc, purchaseDate: rest.purchaseDate ? new Date(rest.purchaseDate) : undefined, warrantyUntil: rest.warrantyUntil ? new Date(rest.warrantyUntil) : undefined, nextMaintenance: rest.nextMaintenance ? new Date(rest.nextMaintenance) : undefined },
      include: { client: true, assetType: true },
    });
    this.generateQR(a.id, a.name, a.code).catch(() => {});
    return a;
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    const { password, ...rest } = dto;
    const data: any = { ...rest };
    if (password) data.passwordEnc = encrypt(password);
    if (rest.purchaseDate) data.purchaseDate = new Date(rest.purchaseDate);
    if (rest.warrantyUntil) data.warrantyUntil = new Date(rest.warrantyUntil);
    if (rest.nextMaintenance) data.nextMaintenance = new Date(rest.nextMaintenance);
    return this.prisma.asset.update({ where: { id }, data, include: { client: true, assetType: true } });
  }

  async remove(id: string) { await this.findOne(id); return this.prisma.asset.delete({ where: { id } }); }

  async revealPassword(id: string) {
    const a = await this.prisma.asset.findUnique({ where: { id }, select: { passwordEnc: true } });
    if (!a) throw new NotFoundException();
    return { password: a.passwordEnc ? decrypt(a.passwordEnc) : null };
  }

  async generateQR(id: string, name: string, code: string) {
    const qr = await QRCode.toDataURL(JSON.stringify({ id, name, code }), { width: 256 });
    await this.prisma.asset.update({ where: { id }, data: { qrCodeUrl: qr } });
    return qr;
  }

  async getQR(id: string) {
    const a = await this.prisma.asset.findUnique({ where: { id }, select: { qrCodeUrl: true, name: true, code: true } });
    if (!a) throw new NotFoundException();
    if (!a.qrCodeUrl) return { qrCodeUrl: await this.generateQR(id, a.name, a.code || id) };
    return a;
  }

  async exportExcel(query: any) {
    const { data } = await this.findAll({ ...query, limit: 9999 });
    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Activos TI');
    ws.columns = [
      { header: 'Código', key: 'code', width: 12 }, { header: 'Nombre', key: 'name', width: 30 },
      { header: 'Cliente', key: 'client', width: 30 }, { header: 'Tipo', key: 'type', width: 20 },
      { header: 'Marca', key: 'brand', width: 15 }, { header: 'Modelo', key: 'model', width: 20 },
      { header: 'Serial', key: 'serial', width: 20 }, { header: 'IP', key: 'ip', width: 16 },
      { header: 'Estado', key: 'status', width: 18 }, { header: 'Ubicación', key: 'location', width: 20 },
      { header: 'Usuario asignado', key: 'user', width: 20 }, { header: 'Garantía hasta', key: 'warranty', width: 14 },
      { header: 'Próx. Mantenimiento', key: 'next', width: 20 },
    ];
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    data.forEach((a: any) => ws.addRow({
      code: a.code||'', name: a.name, client: a.client?.businessName||'', type: a.assetType?.name||'',
      brand: a.brand||'', model: a.model||'', serial: a.serial||'', ip: a.ipAddress||'',
      status: a.status, location: a.location||'', user: a.assignedUser||'',
      warranty: a.warrantyUntil ? new Date(a.warrantyUntil).toLocaleDateString('es-CO') : '',
      next: a.nextMaintenance ? new Date(a.nextMaintenance).toLocaleDateString('es-CO') : '',
    }));
    return wb.xlsx.writeBuffer();
  }

  async exportPdfHtml(query: any) {
    const { data } = await this.findAll({ ...query, limit: 9999 });
    const clientName = data[0]?.client?.businessName || 'Todos los clientes';
    const now = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    const rows = data.map(a => `<tr>
      <td>${a.code||'–'}</td><td>${a.name}</td><td>${(a as any).assetType?.name||'–'}</td>
      <td>${a.brand||'–'} ${a.model||''}</td><td>${a.serial||'–'}</td>
      <td>${a.ipAddress||'–'}</td><td>${a.status}</td>
      <td>${a.warrantyUntil ? new Date(a.warrantyUntil).toLocaleDateString('es-CO') : '–'}</td>
    </tr>`).join('');
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>body{font-family:Arial,sans-serif;padding:24px;font-size:11px;color:#1e293b}
.header{display:flex;justify-content:space-between;border-bottom:3px solid #1d4ed8;padding-bottom:12px;margin-bottom:16px}
.logo{font-size:20px;font-weight:900;color:#1d4ed8}h2{color:#1d4ed8;font-size:13px;margin:0}
table{width:100%;border-collapse:collapse;margin-top:12px}
th{background:#1d4ed8;color:#fff;padding:6px 8px;text-align:left;font-size:10px}
td{padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:10px}
tr:nth-child(even) td{background:#f8fafc}
.footer{margin-top:20px;font-size:10px;color:#94a3b8;text-align:center}
</style></head><body>
<div class="header">
  <div><div class="logo">GIPFEL IT</div><div style="color:#64748b;font-size:11px">Inventario de Activos Tecnológicos</div></div>
  <div style="text-align:right"><h2>${clientName}</h2><div style="color:#64748b;font-size:10px">Generado: ${now} · Total: ${data.length} activos</div></div>
</div>
<table><thead><tr><th>Código</th><th>Nombre</th><th>Tipo</th><th>Marca/Modelo</th><th>Serial</th><th>IP</th><th>Estado</th><th>Garantía</th></tr></thead>
<tbody>${rows}</tbody></table>
<div class="footer">GIPFEL IT — soporte@grupogipfel.com — www.grupogipfel.com</div>
</body></html>`;
  }
}
