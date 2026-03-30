import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { paginate } from '../common/pagination.dto';
@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}
  async findAll(query: any) {
    const where: any = {};
    if (query.assetId) where.assetId = query.assetId;
    if (query.type) where.type = query.type;
    if (query.clientId) where.asset = { clientId: query.clientId };
    if (query.search) where.OR = [{ description: { contains: query.search, mode: 'insensitive' } }, { asset: { name: { contains: query.search, mode: 'insensitive' } } }];
    const { skip, take } = paginate(query.page, query.limit);
    const [data, total] = await Promise.all([
      this.prisma.maintenanceRecord.findMany({ where, skip, take, include: { asset: { include: { client: true, assetType: true } }, technician: { select: { id: true, name: true } } }, orderBy: { date: 'desc' } }),
      this.prisma.maintenanceRecord.count({ where }),
    ]);
    return { data, total };
  }
  async findByAsset(assetId: string) {
    return this.prisma.maintenanceRecord.findMany({
      where: { assetId },
      include: { technician: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
    });
  }
  async create(dto: any) {
    const record = await this.prisma.maintenanceRecord.create({
      data: {
        assetId: dto.assetId,
        technicianId: dto.technicianId||undefined,
        date: new Date(dto.date),
        type: dto.type,
        description: dto.description,
        workDone: dto.workDone,
        parts: dto.parts||undefined,
        timeSpent: dto.timeSpent ? parseFloat(dto.timeSpent) : undefined,
        nextMaint: dto.nextMaint ? new Date(dto.nextMaint) : undefined,
        reportId: dto.reportId||undefined,
      },
      include: { asset: { include: { client: true } }, technician: { select: { id: true, name: true } } },
    });
    if (dto.nextMaint) await this.prisma.asset.update({ where: { id: dto.assetId }, data: { nextMaintenance: new Date(dto.nextMaint), status: 'ACTIVO' } });
    if (dto.status) await this.prisma.asset.update({ where: { id: dto.assetId }, data: { status: dto.status } });
    return record;
  }
  async update(id: string, dto: any) {
    return this.prisma.maintenanceRecord.update({ where: { id }, data: { description: dto.description, workDone: dto.workDone, type: dto.type, timeSpent: dto.timeSpent, parts: dto.parts||undefined, nextMaint: dto.nextMaint ? new Date(dto.nextMaint) : undefined } });
  }
  async remove(id: string) { return this.prisma.maintenanceRecord.delete({ where: { id } }); }
  async exportExcel(query: any) {
    const { data } = await this.findAll({ ...query, limit: 9999 });
    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Mantenimiento');
    ws.columns = [{ header: 'Fecha', key: 'date', width: 14 }, { header: 'Tipo', key: 'type', width: 14 }, { header: 'Activo', key: 'asset', width: 30 }, { header: 'Cliente', key: 'client', width: 30 }, { header: 'Técnico', key: 'tech', width: 25 }, { header: 'Horas', key: 'hours', width: 10 }, { header: 'Descripción', key: 'desc', width: 40 }, { header: 'Trabajo realizado', key: 'work', width: 50 }];
    ws.getRow(1).font = { bold: true };
    data.forEach((m: any) => ws.addRow({ date: new Date(m.date).toLocaleDateString('es-CO'), type: m.type, asset: m.asset?.name||'', client: m.asset?.client?.businessName||'', tech: m.technician?.name||'', hours: m.timeSpent||'', desc: m.description, work: m.workDone||'' }));
    return wb.xlsx.writeBuffer();
  }
}
