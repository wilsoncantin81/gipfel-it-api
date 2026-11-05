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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const reports_service_1 = require("./reports.service");
let ReportsController = class ReportsController {
    constructor(service) {
        this.service = service;
    }
    findAll(q, req) {
        if (req.user?.role === 'CLIENTE')
            q.clientId = req.user.clientId;
        return this.service.findAll(q);
    }
    async findOne(id, req) {
        const r = await this.service.findOne(id);
        if (req.user?.role === 'CLIENTE' && r?.clientId !== req.user.clientId) {
            throw new common_1.ForbiddenException('No autorizado');
        }
        return r;
    }
    create(dto, req) {
        if (req.user?.role === 'CLIENTE')
            throw new common_1.ForbiddenException('No autorizado');
        return this.service.create(dto);
    }
    update(id, dto, req) {
        const role = req.user?.role;
        const perms = req.user?.permissions || [];
        if (role !== 'ADMIN' && !(role === 'TECNICO' && perms.includes('tickets'))) {
            throw new common_1.ForbiddenException('No tiene permiso para modificar reportes');
        }
        return this.service.update(id, dto, req.user?.sub);
    }
    getAuditLog(id, req) {
        if (req.user?.role !== 'ADMIN')
            throw new common_1.ForbiddenException('No autorizado');
        return this.service.getAuditLog(id);
    }
    saveSignature(id, body) { return this.service.saveSignature(id, body.signatureUrl); }
    async pdf(id, res) {
        try {
            const [buffer, r] = await Promise.all([this.service.getPDF(id), this.service.findOne(id)]);
            const safeName = (r?.reportNumber || id).replace(/[^a-zA-Z0-9_-]/g, '_');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
            res.send(buffer);
        }
        catch (error) {
            res.status(500).json({ error: 'Error generating report PDF' });
        }
    }
    sendEmail(id, body) { return this.service.sendEmail(id, body?.email, body?.cc); }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(':id/audit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getAuditLog", null);
__decorate([
    (0, common_1.Post)(':id/signature'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "saveSignature", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "pdf", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "sendEmail", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('Reportes'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map