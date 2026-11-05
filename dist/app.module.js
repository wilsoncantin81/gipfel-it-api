"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const platform_express_1 = require("@nestjs/platform-express");
const prisma_module_1 = require("./common/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const clients_module_1 = require("./clients/clients.module");
const asset_types_module_1 = require("./asset-types/asset-types.module");
const assets_module_1 = require("./assets/assets.module");
const maintenance_module_1 = require("./maintenance/maintenance.module");
const reports_module_1 = require("./reports/reports.module");
const tickets_module_1 = require("./tickets/tickets.module");
const files_module_1 = require("./files/files.module");
const alerts_module_1 = require("./alerts/alerts.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const ai_controller_1 = require("./ai/ai.controller");
const client_notes_controller_1 = require("./client-notes/client-notes.controller");
const team_notes_controller_1 = require("./team-notes/team-notes.controller");
const calendar_controller_1 = require("./calendar/calendar.controller");
const payables_controller_1 = require("./payables/payables.controller");
const prisma_service_1 = require("./common/prisma.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            schedule_1.ScheduleModule.forRoot(),
            platform_express_1.MulterModule.register({ dest: './uploads' }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            clients_module_1.ClientsModule,
            asset_types_module_1.AssetTypesModule,
            assets_module_1.AssetsModule,
            maintenance_module_1.MaintenanceModule,
            reports_module_1.ReportsModule,
            tickets_module_1.TicketsModule,
            files_module_1.FilesModule,
            alerts_module_1.AlertsModule,
            dashboard_module_1.DashboardModule,
        ],
        controllers: [ai_controller_1.AiController, client_notes_controller_1.ClientNotesController, team_notes_controller_1.TeamNotesController, calendar_controller_1.CalendarController, payables_controller_1.PayablesController],
        providers: [prisma_service_1.PrismaService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map