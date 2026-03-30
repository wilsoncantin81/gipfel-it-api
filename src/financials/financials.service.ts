import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class FinancialsService {
  constructor(private prisma: PrismaService) {}

  async getSummary(query: any) {
    const where: any = { status: 'CERRADO' };
    if (query.from) where.resolvedAt = { ...where.resolvedAt, gte: new Date(query.from) };
    if (query.to) where.resolvedAt = { ...where.resolvedAt, lte: new Date(query.to) };
    if (query.technicianId) where.assignedToId = query.technicianId;

    const tickets = await this.prisma.ticket.findMany({
      where,
      include: { client: true, assignedTo: { select: { id: true, name: true } }, commission: true },
      orderBy: { resolvedAt: 'desc' },
    });

    const totalSales = tickets.reduce((s, t) => s + (t.salePrice||0), 0);
    const totalCosts = tickets.reduce((s, t) => s + (t.totalCost||0), 0);
    const totalUtility = tickets.reduce((s, t) => s + (t.utility||0), 0);
    const totalCommissions = tickets.reduce((s, t) => s + (t.commission?.amount||0), 0);

    return { tickets, totalSales, totalCosts, totalUtility, totalCommissions, count: tickets.length };
  }

  async getCommissions(query: any) {
    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status;
    if (query.from) where.createdAt = { ...where.createdAt, gte: new Date(query.from) };
    if (query.to) where.createdAt = { ...where.createdAt, lte: new Date(query.to) };

    const commissions = await this.prisma.commission.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        ticket: { include: { client: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalPending = commissions.filter(c => c.status === 'PENDIENTE').reduce((s, c) => s + c.amount, 0);
    const totalPaid = commissions.filter(c => c.status === 'PAGADA').reduce((s, c) => s + c.amount, 0);
    return { commissions, totalPending, totalPaid };
  }

  async payCommission(id: string, notes?: string) {
    return this.prisma.commission.update({
      where: { id },
      data: { status: 'PAGADA', paidAt: new Date(), notes },
    });
  }

  async payAllCommissions(userId: string) {
    return this.prisma.commission.updateMany({
      where: { userId, status: 'PENDIENTE' },
      data: { status: 'PAGADA', paidAt: new Date() },
    });
  }

  async getTechnicians() {
    return this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
  }

  async exportExcel(query: any) {
    const { tickets } = await this.getSummary(query);
    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Resumen Financiero');
    ws.columns = [
      { header: 'Ticket', key: 'num', width: 14 },
      { header: 'Cliente', key: 'client', width: 30 },
      { header: 'Técnico', key: 'tech', width: 25 },
      { header: 'Fecha cierre', key: 'date', width: 14 },
      { header: 'N° Factura', key: 'invoice', width: 16 },
      { header: 'Venta', key: 'sale', width: 14 },
      { header: 'Costos', key: 'cost', width: 14 },
      { header: 'Utilidad', key: 'utility', width: 14 },
      { header: 'Comisión', key: 'commission', width: 14 },
      { header: 'Estado comisión', key: 'commStatus', width: 18 },
    ];
    ws.getRow(1).font = { bold: true };
    tickets.forEach((t: any) => ws.addRow({
      num: t.ticketNumber, client: t.client?.businessName||'', tech: t.assignedTo?.name||'',
      date: t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString('es-CO') : '',
      invoice: t.invoiceNumber||'', sale: t.salePrice||0, cost: t.totalCost||0,
      utility: t.utility||0, commission: t.commission?.amount||0,
      commStatus: t.commission?.status||'N/A',
    }));
    return wb.xlsx.writeBuffer();
  }
}
