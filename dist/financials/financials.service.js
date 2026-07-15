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
exports.FinancialsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
let FinancialsService = class FinancialsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSummary(query) {
        const where = { status: 'CERRADO' };
        if (query.from)
            where.resolvedAt = { ...where.resolvedAt, gte: new Date(query.from) };
        if (query.to)
            where.resolvedAt = { ...where.resolvedAt, lte: new Date(query.to) };
        if (query.technicianId)
            where.assignedToId = query.technicianId;
        const tickets = await this.prisma.ticket.findMany({
            where,
            include: { client: true, assignedTo: { select: { id: true, name: true } }, commission: true },
            orderBy: { resolvedAt: 'desc' },
        });
        const totalSales = tickets.reduce((s, t) => s + (t.salePrice || 0), 0);
        const totalCosts = tickets.reduce((s, t) => s + (t.totalCost || 0), 0);
        const totalUtility = tickets.reduce((s, t) => s + (t.utility || 0), 0);
        const totalCommissions = tickets.reduce((s, t) => s + (t.commission?.amount || 0), 0);
        return { tickets, totalSales, totalCosts, totalUtility, totalCommissions, count: tickets.length };
    }
    async getCommissions(query) {
        const where = {};
        if (query.userId)
            where.userId = query.userId;
        if (query.status)
            where.status = query.status;
        if (query.from)
            where.createdAt = { ...where.createdAt, gte: new Date(query.from) };
        if (query.to)
            where.createdAt = { ...where.createdAt, lte: new Date(query.to) };
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
    async payCommission(id, notes) {
        return this.prisma.commission.update({
            where: { id },
            data: { status: 'PAGADA', paidAt: new Date(), notes },
        });
    }
    async payAllCommissions(userId) {
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
    async exportExcel(query) {
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
        tickets.forEach((t) => ws.addRow({
            num: t.ticketNumber, client: t.client?.businessName || '', tech: t.assignedTo?.name || '',
            date: t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString('es-CO') : '',
            invoice: t.invoiceNumber || '', sale: t.salePrice || 0, cost: t.totalCost || 0,
            utility: t.utility || 0, commission: t.commission?.amount || 0,
            commStatus: t.commission?.status || 'N/A',
        }));
        return wb.xlsx.writeBuffer();
    }
};
exports.FinancialsService = FinancialsService;
exports.FinancialsService = FinancialsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinancialsService);
//# sourceMappingURL=financials.service.js.map