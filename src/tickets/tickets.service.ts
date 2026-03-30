import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { paginate } from '../common/pagination.dto';
@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}
  private async nextNumber() { const count = await this.prisma.ticket.count(); return `TK-${String(count+1).padStart(4,'0')}`; }
  async findAll(query: any) {
    const where: any = {};
    if (query.clientId) where.clientId = query.clientId;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.assignedToId) where.assignedToId = query.assignedToId;
    if (query.search) where.OR = [{ title: { contains: query.search, mode: 'insensitive' } }, { ticketNumber: { contains: query.search, mode: 'insensitive' } }];
    const { skip, take } = paginate(query.page, query.limit);
    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({ where, skip, take, include: { client: true, asset: true, assignedTo: { select: { id: true, name: true } }, report: { select: { id: true, reportNumber: true } }, tasks: { orderBy: { order: 'asc' } }, _count: { select: { expenses: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.ticket.count({ where }),
    ]);
    return { data, total };
  }
  async findOne(id: string) {
    const t = await this.prisma.ticket.findUnique({ where: { id }, include: { client: true, asset: { include: { assetType: true } }, assignedTo: { select: { id: true, name: true, email: true } }, report: { select: { id: true, reportNumber: true, date: true } }, tasks: { orderBy: { order: 'asc' } }, expenses: { orderBy: { date: 'asc' } }, commission: { include: { user: { select: { id: true, name: true } } } } } });
    if (!t) throw new NotFoundException('Ticket no encontrado');
    return t;
  }
  async create(dto: any) {
    const ticketNumber = await this.nextNumber();
    return this.prisma.ticket.create({ data: { ticketNumber, clientId: dto.clientId, assetId: dto.assetId||undefined, assignedToId: dto.assignedToId||undefined, title: dto.title, description: dto.description, priority: dto.priority||'MEDIA', status: 'NUEVO', tasks: dto.tasks?.length ? { create: dto.tasks.map((t: any, i: number) => ({ title: t, order: i })) } : undefined }, include: { client: true, assignedTo: { select: { id: true, name: true } }, tasks: true } });
  }
  async update(id: string, dto: any) {
    await this.findOne(id);
    const { tasks, ...rest } = dto;
    return this.prisma.ticket.update({ where: { id }, data: rest, include: { client: true, assignedTo: { select: { id: true, name: true } }, tasks: true, expenses: true } });
  }
  async updateStatus(id: string, status: string, extra?: any) {
    const ticket = await this.findOne(id);
    if (status === 'CERRADO') {
      if (!ticket.reportId) throw new BadRequestException('Debe asociar un reporte antes de cerrar el ticket');
      if (!ticket.conclusion) throw new BadRequestException('Debe agregar una conclusión antes de cerrar el ticket');
      const expenses = await this.prisma.ticketExpense.findMany({ where: { ticketId: id } });
      const totalCost = expenses.reduce((s, e) => s + e.total, 0);
      const salePrice = extra?.salePrice || ticket.salePrice || 0;
      const utility = salePrice - totalCost;
      const updated = await this.prisma.ticket.update({ where: { id }, data: { status: 'CERRADO', resolvedAt: new Date(), totalCost, utility, invoiceNumber: extra?.invoiceNumber||ticket.invoiceNumber, salePrice } });
      if (ticket.assignedToId && utility > 0) {
        await this.prisma.commission.upsert({ where: { ticketId: id }, update: { amount: utility * 0.10, userId: ticket.assignedToId }, create: { ticketId: id, userId: ticket.assignedToId, amount: utility * 0.10, percentage: 10, status: 'PENDIENTE' } });
      }
      return updated;
    }
    const data: any = { status };
    if (extra?.conclusion) data.conclusion = extra.conclusion;
    if (extra?.invoiceNumber) data.invoiceNumber = extra.invoiceNumber;
    if (extra?.salePrice) data.salePrice = extra.salePrice;
    if (extra?.reportId) data.reportId = extra.reportId;
    return this.prisma.ticket.update({ where: { id }, data });
  }
  async addTask(ticketId: string, title: string) { const count = await this.prisma.ticketTask.count({ where: { ticketId } }); return this.prisma.ticketTask.create({ data: { ticketId, title, order: count } }); }
  async toggleTask(taskId: string) { const task = await this.prisma.ticketTask.findUnique({ where: { id: taskId } }); if (!task) throw new NotFoundException(); return this.prisma.ticketTask.update({ where: { id: taskId }, data: { done: !task.done } }); }
  async deleteTask(taskId: string) { return this.prisma.ticketTask.delete({ where: { id: taskId } }); }
  async addExpense(ticketId: string, dto: any) { return this.prisma.ticketExpense.create({ data: { ticketId, date: new Date(dto.date), description: dto.description, supplier: dto.supplier, supplierInvoice: dto.supplierInvoice, quantity: dto.quantity, unitPrice: dto.unitPrice, total: dto.quantity * dto.unitPrice } }); }
  async deleteExpense(expenseId: string) { return this.prisma.ticketExpense.delete({ where: { id: expenseId } }); }
  async getExpenseSummary(ticketId: string) { const [expenses, ticket] = await Promise.all([this.prisma.ticketExpense.findMany({ where: { ticketId } }), this.prisma.ticket.findUnique({ where: { id: ticketId } })]); const totalCost = expenses.reduce((s, e) => s + e.total, 0); const salePrice = ticket?.salePrice||0; const utility = salePrice - totalCost; return { expenses, totalCost, salePrice, utility, commission: utility * 0.10 }; }
  async remove(id: string) { return this.prisma.ticket.delete({ where: { id } }); }
}
