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
exports.AlertsService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../common/prisma.service");
let AlertsService = class AlertsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateAlerts() {
        const now = new Date();
        const in90 = new Date(now.getTime() + 90 * 86400000);
        const in30 = new Date(now.getTime() + 30 * 86400000);
        const [warrantyAssets, maintAssets] = await Promise.all([
            this.prisma.asset.findMany({ where: { warrantyUntil: { lte: in90 }, status: 'ACTIVO' } }),
            this.prisma.asset.findMany({ where: { nextMaintenance: { lte: in30 }, status: 'ACTIVO' } }),
        ]);
        let created = 0;
        for (const a of warrantyAssets) {
            const ex = await this.prisma.alert.findFirst({ where: { assetId: a.id, type: 'GARANTIA', isRead: false } });
            if (!ex) {
                await this.prisma.alert.create({ data: { assetId: a.id, clientId: a.clientId, type: 'GARANTIA', message: `Garantía de "${a.name}" vence el ${a.warrantyUntil?.toLocaleDateString('es-CO')}`, dueDate: a.warrantyUntil } });
                created++;
            }
        }
        for (const a of maintAssets) {
            const ex = await this.prisma.alert.findFirst({ where: { assetId: a.id, type: 'MANTENIMIENTO', isRead: false } });
            if (!ex) {
                await this.prisma.alert.create({ data: { assetId: a.id, clientId: a.clientId, type: 'MANTENIMIENTO', message: `Mantenimiento de "${a.name}" programado para ${a.nextMaintenance?.toLocaleDateString('es-CO')}`, dueDate: a.nextMaintenance } });
                created++;
            }
        }
        return { alertsCreated: created };
    }
    async findAll(query) {
        const where = {};
        if (query.clientId)
            where.clientId = query.clientId;
        if (query.isRead !== undefined)
            where.isRead = query.isRead === 'true';
        if (query.type)
            where.type = query.type;
        return this.prisma.alert.findMany({ where, orderBy: { createdAt: 'desc' }, include: { asset: true, client: true } });
    }
    async markRead(id) { return this.prisma.alert.update({ where: { id }, data: { isRead: true } }); }
    async markAllRead() { return this.prisma.alert.updateMany({ where: { isRead: false }, data: { isRead: true } }); }
    async getUnreadCount() { return { count: await this.prisma.alert.count({ where: { isRead: false } }) }; }
};
exports.AlertsService = AlertsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_8AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AlertsService.prototype, "generateAlerts", null);
exports.AlertsService = AlertsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AlertsService);
//# sourceMappingURL=alerts.service.js.map