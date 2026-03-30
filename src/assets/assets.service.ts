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
    if (query.search) where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { serial: { contains: query.search, mode: 'insensitive' } },
      { code: { contains: query.search, mode: 'insensitive' } },
      { ipAddress: { contains: query.search } },
      { brand: { contains: query.search, mode: 'insensitive' } },
    ];
    if (query.clientId) where.clientId = query.clientId;
    if (query.assetTypeId) where.assetTypeId = query.assetTypeId;
    if (query.status) where.status = query.status;
    const { skip, take } = paginate(query.page, query.limit);
    const [data, total] = await Promise.all([
      this.prisma.asset.findMany({ where, skip, take, include: { client: true, assetType: true }, orderBy: { code: 'asc' } }),
      this.prisma.asset.count({ where }),
    ]);
    return { data: data.map(a => ({ ...a, passwordEnc: undefined })), total };
  }

  async searchByCode(code: string, clientId?: string) {
    const where: any = { OR: [{ code: { contains: code, mode: 'insensitive' } }, { name: { contains: code, mode: 'insensitive' } }, { serial: { contains: code, mode: 'insensitive' } }] };
    if (clientId) where.clientId = clientId;
    return this.prisma.asset.findMany({ where, take: 10, include: { assetType: true, client: true }, orderBy: { code: 'asc' } });
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
  async revealPassword(id: string) { const a = await this.prisma.asset.findUnique({ where: { id }, select: { passwordEnc: true } }); if (!a) throw new NotFoundException(); return { password: a.passwordEnc ? decrypt(a.passwordEnc) : null }; }
  async generateQR(id: string, name: string, code: string) { const qr = await QRCode.toDataURL(JSON.stringify({ id, name, code }), { width: 256 }); await this.prisma.asset.update({ where: { id }, data: { qrCodeUrl: qr } }); return qr; }
  async getQR(id: string) { const a = await this.prisma.asset.findUnique({ where: { id }, select: { qrCodeUrl: true, name: true, code: true } }); if (!a) throw new NotFoundException(); if (!a.qrCodeUrl) return { qrCodeUrl: await this.generateQR(id, a.name, a.code||id) }; return a; }

  async exportExcel(query: any) {
    const { data } = await this.findAll({ ...query, limit: 9999 });
    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Activos');
    ws.columns = [{ header: 'Código', key: 'code', width: 12 }, { header: 'Nombre', key: 'name', width: 30 }, { header: 'Cliente', key: 'client', width: 30 }, { header: 'Tipo', key: 'type', width: 20 }, { header: 'Marca', key: 'brand', width: 15 }, { header: 'Modelo', key: 'model', width: 20 }, { header: 'Serial', key: 'serial', width: 20 }, { header: 'IP', key: 'ip', width: 16 }, { header: 'Estado', key: 'status', width: 18 }, { header: 'Garantía', key: 'warranty', width: 14 }, { header: 'Próx. Mant.', key: 'next', width: 14 }];
    ws.getRow(1).font = { bold: true };
    data.forEach((a: any) => ws.addRow({ code: a.code||'', name: a.name, client: a.client?.businessName||'', type: a.assetType?.name||'', brand: a.brand||'', model: a.model||'', serial: a.serial||'', ip: a.ipAddress||'', status: a.status, warranty: a.warrantyUntil ? new Date(a.warrantyUntil).toLocaleDateString('es-CO') : '', next: a.nextMaintenance ? new Date(a.nextMaintenance).toLocaleDateString('es-CO') : '' }));
    return wb.xlsx.writeBuffer();
  }
}
