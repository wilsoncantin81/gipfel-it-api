import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { AssetsModule } from './assets/assets.module';
import { TicketsModule } from './tickets/tickets.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { AssetTypesModule } from './asset-types/asset-types.module';
import { FilesModule } from './files/files.module';
import { FinancialsModule } from './financials/financials.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { AlertsModule } from './alerts/alerts.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ClientsModule,
    AssetsModule,
    TicketsModule,
    DashboardModule,
    AssetTypesModule,
    ReportsModule,
    FilesModule,
    FinancialsModule,
    MaintenanceModule,
    AlertsModule,
    AiModule,
  ],
})
export class AppModule {}
