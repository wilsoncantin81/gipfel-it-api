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
exports.ClientsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const pagination_dto_1 = require("../common/pagination.dto");
let ClientsService = class ClientsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const where = {};
        if (query.search)
            where.OR = [{ businessName: { contains: query.search, mode: 'insensitive' } }, { city: { contains: query.search, mode: 'insensitive' } }];
        if (query.status)
            where.status = query.status;
        const { skip, take } = (0, pagination_dto_1.paginate)(query.page, query.limit);
        const [data, total] = await Promise.all([
            this.prisma.client.findMany({ where, skip, take, include: { _count: { select: { assets: true } } }, orderBy: { businessName: 'asc' } }),
            this.prisma.client.count({ where }),
        ]);
        return { data, total };
    }
    async findOne(id) {
        const c = await this.prisma.client.findUnique({ where: { id }, include: { assets: { include: { assetType: true } }, _count: { select: { assets: true, reports: true, tickets: true } } } });
        if (!c)
            throw new common_1.NotFoundException('Cliente no encontrado');
        return c;
    }
    async create(dto) { return this.prisma.client.create({ data: dto }); }
    async update(id, dto) { await this.findOne(id); return this.prisma.client.update({ where: { id }, data: dto }); }
    async remove(id) { await this.findOne(id); return this.prisma.client.delete({ where: { id } }); }
    async updateLogo(id, logoUrl) { return this.prisma.client.update({ where: { id }, data: { logoUrl } }); }
    async getStats(id) {
        const [assets, activeAssets, mantAssets, openTickets, reports] = await Promise.all([
            this.prisma.asset.count({ where: { clientId: id } }),
            this.prisma.asset.count({ where: { clientId: id, status: 'ACTIVO' } }),
            this.prisma.asset.count({ where: { clientId: id, status: 'EN_MANTENIMIENTO' } }),
            this.prisma.ticket.count({ where: { clientId: id, status: { not: 'CERRADO' } } }),
            this.prisma.serviceReport.count({ where: { clientId: id } }),
        ]);
        return { assets, activeAssets, mantAssets, openTickets, reports };
    }
    async getTechnicians() {
        return this.prisma.user.findMany({
            where: { isActive: true },
            select: { id: true, name: true, email: true, role: true },
            orderBy: { name: 'asc' },
        });
    }
};
exports.ClientsService = ClientsService;
exports.ClientsService = ClientsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClientsService);
//# sourceMappingURL=clients.service.js.map