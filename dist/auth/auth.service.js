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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../common/prisma.service");
const bcrypt = require("bcrypt");
const ALL_MODULES = ['dashboard', 'clientes', 'activos', 'mantenimiento', 'reportes', 'tickets', 'tipos', 'usuarios', 'financiero', 'comisiones'];
const CLIENT_MODULES = ['activos', 'tickets'];
let AuthService = class AuthService {
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async validateUser(email, password) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive)
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        if (!(await bcrypt.compare(password, user.passwordHash)))
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        const { passwordHash, ...result } = user;
        return result;
    }
    async login(user) {
        const fullUser = await this.prisma.user.findUnique({ where: { id: user.id }, select: { id: true, name: true, email: true, role: true, permissions: true, clientId: true } });
        const defaultPermissions = fullUser?.role === 'CLIENTE' ? CLIENT_MODULES : ALL_MODULES;
        const permissions = fullUser?.permissions || defaultPermissions;
        const payload = { sub: user.id, email: user.email, role: user.role, clientId: fullUser?.clientId || null };
        return {
            access_token: this.jwt.sign(payload),
            user: { id: user.id, name: user.name, email: user.email, role: user.role, permissions, clientId: fullUser?.clientId || null },
        };
    }
    async register(dto) {
        const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (exists)
            throw new common_1.ConflictException('Correo ya registrado');
        const role = dto.role || 'TECNICO';
        if (role === 'CLIENTE' && !dto.clientId)
            throw new common_1.BadRequestException('clientId es requerido para crear un usuario CLIENTE');
        if (dto.clientId) {
            const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
            if (!client)
                throw new common_1.BadRequestException('El cliente indicado no existe');
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const permissions = dto.permissions || (role === 'CLIENTE' ? CLIENT_MODULES : ALL_MODULES);
        const user = await this.prisma.user.create({
            data: { name: dto.name, email: dto.email, passwordHash, role, permissions, clientId: role === 'CLIENTE' ? dto.clientId : null, phone: dto.phone || undefined, whatsappApiKey: dto.whatsappApiKey || undefined },
        });
        return { id: user.id, name: user.name, email: user.email, role: user.role, clientId: user.clientId };
    }
    async getProfile(userId) {
        return this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true, isActive: true, permissions: true, clientId: true, phone: true, whatsappApiKey: true } });
    }
    async getUsers() {
        return this.prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, isActive: true, permissions: true, clientId: true, phone: true, whatsappApiKey: true }, orderBy: { name: 'asc' } });
    }
    async getTechnicians() {
        return this.prisma.user.findMany({ where: { isActive: true, role: { in: ['ADMIN', 'TECNICO'] } }, select: { id: true, name: true, email: true, role: true }, orderBy: { name: 'asc' } });
    }
    async updatePermissions(id, permissions) {
        return this.prisma.user.update({ where: { id }, data: { permissions: permissions } });
    }
    async updateContact(id, dto) {
        const data = {};
        if (dto.phone !== undefined)
            data.phone = dto.phone || null;
        if (dto.whatsappApiKey !== undefined)
            data.whatsappApiKey = dto.whatsappApiKey || null;
        return this.prisma.user.update({ where: { id }, data });
    }
    async resetPassword(id, password) {
        const passwordHash = await bcrypt.hash(password, 12);
        await this.prisma.user.update({ where: { id }, data: { passwordHash } });
        return { success: true };
    }
    async updateStatus(id, isActive) {
        return this.prisma.user.update({ where: { id }, data: { isActive } });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map