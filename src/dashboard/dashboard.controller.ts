import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
@ApiTags('Dashboard') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}
  @Get('kpis') getKPIs() { return this.service.getKPIs(); }
  @Get('activity') getActivity(@Query('limit') limit: number) { return this.service.getRecentActivity(limit); }
  @Get('warranty-expiring') getWarranty() { return this.service.getWarrantyExpiring(); }
  @Get('maintenance-due') getMaintDue() { return this.service.getMaintenanceDue(); }
  @Get('assets-by-type') getByType() { return this.service.getAssetsByType(); }
  @Get('assets-by-client') getByClient() { return this.service.getAssetsByClient(); }
  @Get('technician-stats') getTechStats() { return this.service.getTechnicianStats(); }
}
