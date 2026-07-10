import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { AssetsModule } from './assets/assets.module';
import { TicketsModule } from './tickets/tickets.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';

@Module({
    imports: [
          ConfigModule.forRoot({ isGlobal: true }),
          PrismaModule,
          AuthModule,
          ClientsModule,
          AssetsModule,
          TicketsModule,
          DashboardModule,
          ReportsModule,
        ],
})
  export class AppModule {}
