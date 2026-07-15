"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const notify_1 = require("../common/notify");
let TicketsService = class TicketsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(q) {
        const where = {};
        if (q.status)
            where.status = q.status;
        if (q.clientId)
            where.clientId = q.clientId;
        if (q.assignedToId)
            where.assignedToId = q.assignedToId;
        if (q.priority)
            where.priority = q.priority;
        return this.prisma.ticket.findMany({
            where,
            include: {
                client: { select: { id: true, businessName: true } },
                assignedTo: { select: { id: true, name: true } },
                _count: { select: { tasks: true, expenses: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id },
            include: {
                client: true,
                asset: { include: { assetType: true } },
                assignedTo: { select: { id: true, name: true, email: true } },
                report: { select: { id: true, reportNumber: true, date: true } },
                tasks: { orderBy: { order: 'asc' } },
                expenses: { orderBy: { date: 'asc' } },
                commission: { include: { user: { select: { id: true, name: true } } } },
            },
        });
        const statusLogs = await this.prisma.$queryRaw `
  SELECT * FROM ticket_status_logs WHERE ticket_id = ${id} ORDER BY changed_at ASC
  `;
        return { ...ticket, statusLogs };
    }
    async getTask(id) {
        return this.prisma.ticketTask.findUnique({ where: { id } });
    }
    async getExpenseSummary(id) {
        const [expenses, ticket] = await Promise.all([
            this.prisma.ticketExpense.findMany({ where: { ticketId: id } }),
            this.prisma.ticket.findUnique({ where: { id } }),
        ]);
        const totalCost = expenses.reduce((s, e) => s + e.total, 0);
        const salePrice = ticket?.salePrice || 0;
        const utility = salePrice - totalCost;
        return { expenses, totalCost, salePrice, utility, commission: utility * 0.1 };
    }
    async create(dto) {
        const count = await this.prisma.ticket.count();
        const ticketNumber = `TKT-${String(count + 1).padStart(5, '0')}`;
        const { tasks, ...rest } = dto;
        if (rest.assetId) {
            const asset = await this.prisma.asset.findUnique({ where: { id: rest.assetId } });
            if (!asset || asset.clientId !== rest.clientId) {
                throw new common_1.BadRequestException('El activo no pertenece a este cliente');
            }
        }
        const data = {
            ticketNumber,
            clientId: rest.clientId,
            title: rest.title,
            description: rest.description || undefined,
            priority: rest.priority || 'MEDIA',
            status: 'NUEVO',
            assetId: rest.assetId || undefined,
            assignedToId: rest.assignedToId || undefined,
        };
        if (tasks && tasks.length > 0) {
            data.tasks = { create: tasks.map((title, i) => ({ title, order: i })) };
        }
        const ticket = await this.prisma.ticket.create({ data, include: { client: true } });
        await this.logStatusChange(ticket.id, 'NUEVO', rest.userId);
        if (data.assignedToId) {
            (0, notify_1.notifyTicketAssigned)(this.prisma, ticket.id).catch(() => { });
        }
        return ticket;
    }
    async update(id, dto) {
        const before = await this.prisma.ticket.findUnique({ where: { id } });
        const updated = await this.prisma.ticket.update({ where: { id }, data: dto });
        if (dto.assignedToId && dto.assignedToId !== before?.assignedToId) {
            (0, notify_1.notifyTicketAssigned)(this.prisma, id).catch(() => { });
        }
        return updated;
    }
    parseDate(d) {
        if (!d)
            return new Date();
        if (d.includes('T'))
            return new Date(d);
        return new Date(d + 'T12:00:00.000Z'.replace('Z', '-05:00'));
    }
    async logStatusChange(ticketId, status, userId) {
        try {
            await this.prisma.$executeRaw `
    INSERT INTO ticket_status_logs (id, ticket_id, status, changed_at, changed_by)
    VALUES (gen_random_uuid()::text, ${ticketId}, ${status}, now(), ${userId || null})
    `;
        }
        catch { }
    }
    async updateStatus(id, body, userId) {
        const { status, conclusion, invoiceNumber, salePrice, reportId } = body;
        if (status === 'CERRADO') {
            const isNormalClosure = !body.closureType || body.closureType === 'NORMAL';
            if (isNormalClosure) {
                const ticket = await this.prisma.ticket.findUnique({ where: { id } });
                if (!ticket?.invoiceNumber && !invoiceNumber) {
                    throw new common_1.BadRequestException('Se requiere número de factura para cierre normal');
                }
            }
        }
        const { closureType, commissionPercentage } = body;
        const data = { status };
        if (conclusion)
            data.conclusion = conclusion;
        if (invoiceNumber)
            data.invoiceNumber = invoiceNumber;
        if (salePrice !== undefined)
            data.salePrice = salePrice;
        if (reportId !== undefined)
            data.reportId = reportId || null;
        if (closureType)
            data.closureType = closureType;
        if (status === 'CERRADO') {
            data.resolvedAt = new Date();
            const ticket = await this.prisma.ticket.findUnique({ where: { id } });
            const isNormal = !closureType || closureType === 'NORMAL';
            const finalSalePrice = isNormal ? (salePrice || ticket?.salePrice || 0) : 0;
            const finalCost = ticket?.totalCost || 0;
            const utility = finalSalePrice - finalCost;
            data.utility = utility;
            data.salePrice = finalSalePrice;
            const commPct = commissionPercentage !== undefined ? Number(commissionPercentage) : 10;
            if (ticket?.assignedToId && utility > 0 && commPct > 0) {
                const commAmount = utility * (commPct / 100);
                await this.prisma.commission.upsert({
                    where: { ticketId: id },
                    create: { ticketId: id, userId: ticket.assignedToId, amount: commAmount, percentage: commPct },
                    update: { amount: commAmount, percentage: commPct },
                });
            }
            else if (commPct === 0) {
                await this.prisma.commission.deleteMany({ where: { ticketId: id } }).catch(() => { });
            }
        }
        const updated = await this.prisma.ticket.update({ where: { id }, data });
        await this.logStatusChange(id, status, userId);
        return updated;
    }
    async updateBilling(id, body) {
        const { invoiceNumber, salePrice, conclusion } = body;
        const data = {};
        if (invoiceNumber !== undefined)
            data.invoiceNumber = invoiceNumber;
        if (salePrice !== undefined) {
            data.salePrice = salePrice;
            const expenses = await this.prisma.ticketExpense.findMany({ where: { ticketId: id } });
            const totalCost = expenses.reduce((s, e) => s + e.total, 0);
            data.totalCost = totalCost;
            data.utility = salePrice - totalCost;
        }
        if (conclusion !== undefined)
            data.conclusion = conclusion;
        return this.prisma.ticket.update({ where: { id }, data });
    }
    async getStatusLogs(id) {
        const logs = await this.prisma.$queryRaw `
  SELECT l.*, u.name as user_name
  FROM ticket_status_logs l
  LEFT JOIN users u ON l.changed_by = u.id
  WHERE l.ticket_id = ${id}
  ORDER BY l.changed_at ASC
  `;
        return logs.map((log, i) => ({
            ...log,
            changedAt: log.changed_at,
            status: log.status,
            userName: log.user_name,
            durationMs: i < logs.length - 1
                ? new Date(logs[i + 1].changed_at).getTime() - new Date(log.changed_at).getTime()
                : Date.now() - new Date(log.changed_at).getTime(),
        }));
    }
    async addTask(ticketId, title) {
        const count = await this.prisma.ticketTask.count({ where: { ticketId } });
        return this.prisma.ticketTask.create({ data: { ticketId, title, order: count } });
    }
    async toggleTask(id) {
        const task = await this.prisma.ticketTask.findUnique({ where: { id } });
        if (!task)
            throw new common_1.BadRequestException('Tarea no encontrada');
        return this.prisma.ticketTask.update({ where: { id }, data: { done: !task.done } });
    }
    async deleteTask(id) {
        await this.prisma.ticketTask.delete({ where: { id } });
        return { deleted: true };
    }
    async addExpense(ticketId, dto) {
        const qty = Number(dto.quantity) || 1;
        const price = Number(dto.unitPrice);
        const total = qty * price;
        const expense = await this.prisma.ticketExpense.create({
            data: { ticketId, date: this.parseDate(dto.date), description: dto.description, supplier: dto.supplier, supplierInvoice: dto.supplierInvoice, quantity: qty, unitPrice: price, total },
        });
        const allExpenses = await this.prisma.ticketExpense.findMany({ where: { ticketId } });
        const totalCost = allExpenses.reduce((s, e) => s + e.total, 0);
        const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
        const utility = (ticket?.salePrice || 0) - totalCost;
        await this.prisma.ticket.update({ where: { id: ticketId }, data: { totalCost, utility } });
        return expense;
    }
    async deleteExpense(id) {
        const expense = await this.prisma.ticketExpense.findUnique({ where: { id } });
        if (!expense)
            throw new common_1.BadRequestException('Gasto no encontrado');
        await this.prisma.ticketExpense.delete({ where: { id } });
        const allExpenses = await this.prisma.ticketExpense.findMany({ where: { ticketId: expense.ticketId } });
        const totalCost = allExpenses.reduce((s, e) => s + e.total, 0);
        const ticket = await this.prisma.ticket.findUnique({ where: { id: expense.ticketId } });
        const utility = (ticket?.salePrice || 0) - totalCost;
        await this.prisma.ticket.update({ where: { id: expense.ticketId }, data: { totalCost, utility } });
        return { deleted: true };
    }
    async remove(id) {
        await this.prisma.ticket.delete({ where: { id } });
        return { deleted: true };
    }
};
exports.TicketsService = TicketsService;
exports.TicketsService = TicketsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TicketsService);
//# sourceMappingURL=tickets.service.js.map