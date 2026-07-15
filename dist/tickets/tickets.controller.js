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
exports.TicketsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const tickets_service_1 = require("./tickets.service");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
let TicketsController = class TicketsController {
    constructor(service) {
        this.service = service;
    }
    findAll(q, req) {
        if (req.user?.role === 'CLIENTE')
            q.clientId = req.user.clientId;
        return this.service.findAll(q);
    }
    getTask(id) { return this.service.getTask(id); }
    getSummary(id) { return this.service.getExpenseSummary(id); }
    async findOne(id, req) {
        return this.assertOwnTicket(id, req);
    }
    create(dto, req) {
        const payload = { ...dto, userId: req.user?.sub };
        if (req.user?.role === 'CLIENTE') {
            payload.clientId = req.user.clientId;
            payload.assignedToId = undefined;
        }
        return this.service.create(payload);
    }
    addTask(id, body) { return this.service.addTask(id, body.title); }
    addExpense(id, dto) { return this.service.addExpense(id, dto); }
    toggleTask(id) { return this.service.toggleTask(id); }
    updateStatus(id, body, req) { return this.service.updateStatus(id, body, req.user?.sub); }
    update(id, dto) { return this.service.update(id, dto); }
    deleteTask(id) { return this.service.deleteTask(id); }
    deleteExpense(id) { return this.service.deleteExpense(id); }
    remove(id) { return this.service.remove(id); }
    async assertOwnTicket(id, req) {
        const ticket = await this.service.findOne(id);
        if (req.user?.role === 'CLIENTE' && ticket?.clientId !== req.user.clientId) {
            throw new common_1.ForbiddenException('No autorizado');
        }
        return ticket;
    }
};
exports.TicketsController = TicketsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('tasks/:taskId'),
    (0, roles_decorator_1.Roles)('ADMIN', 'TECNICO'),
    __param(0, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "getTask", null);
__decorate([
    (0, common_1.Get)(':id/expenses/summary'),
    (0, roles_decorator_1.Roles)('ADMIN', 'TECNICO'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/tasks'),
    (0, roles_decorator_1.Roles)('ADMIN', 'TECNICO'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "addTask", null);
__decorate([
    (0, common_1.Post)(':id/expenses'),
    (0, roles_decorator_1.Roles)('ADMIN', 'TECNICO'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "addExpense", null);
__decorate([
    (0, common_1.Put)('tasks/:taskId/toggle'),
    (0, roles_decorator_1.Roles)('ADMIN', 'TECNICO'),
    __param(0, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "toggleTask", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, roles_decorator_1.Roles)('ADMIN', 'TECNICO'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'TECNICO'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('tasks/:taskId'),
    (0, roles_decorator_1.Roles)('ADMIN', 'TECNICO'),
    __param(0, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "deleteTask", null);
__decorate([
    (0, common_1.Delete)('expenses/:expenseId'),
    (0, roles_decorator_1.Roles)('ADMIN', 'TECNICO'),
    __param(0, (0, common_1.Param)('expenseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "deleteExpense", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'TECNICO'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "remove", null);
exports.TicketsController = TicketsController = __decorate([
    (0, swagger_1.ApiTags)('Tickets'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, common_1.Controller)('tickets'),
    __metadata("design:paramtypes", [tickets_service_1.TicketsService])
], TicketsController);
//# sourceMappingURL=tickets.controller.js.map