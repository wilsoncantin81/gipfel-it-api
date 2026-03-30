import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}
  async getKPIs() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const in90 = new Date(now.getTime() + 90*86400000);
    const in30 = new Date(now.getTime() + 30*86400000);
    const [totalClients, activeClients, totalAssets, activeAssets, maintAssets, bajasAssets,
      openTickets, criticalTickets, pendingWilson,
      reportsThisMonth, totalReports,
      warrantyExpiring, maintDue, unreadAlerts,
      salesThisMonth, pendingCommissions] = await Promise.all([
      this.prisma.client.count(),
      this.prisma.client.count({ where: { status: 'ACTIVO' } }),
      this.prisma.asset.count(),
      this.prisma.asset.count({ where: { status: 'ACTIVO' } }),
      this.prisma.asset.count({ where: { status: 'EN_MANTENIMIENTO' } }),
      this.prisma.asset.count({ where: { status: 'DADO_DE_BAJA' } }),
      this.prisma.ticket.count({ where: { status: { not: 'CERRADO' } } }),
      this.prisma.ticket.count({ where: { status: { not: 'CERRADO' }, priority: 'CRITICA' } }),
      this.prisma.ticket.count({ where: { status: 'PENDIENTE_WILSON' } }),
      this.prisma.serviceReport.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.serviceReport.count(),
      this.prisma.asset.count({ where: { warrantyUntil: { lte: in90, gte: now }, status: 'ACTIVO' } }),
      this.prisma.asset.count({ where: { nextMaintenance: { lte: in30, gte: now }, status: 'ACTIVO' } }),
      this.prisma.alert.count({ where: { isRead: false } }),
      this.prisma.ticket.aggregate({ where: { status: 'CERRADO', resolvedAt: { gte: startOfMonth } }, _sum: { salePrice: true, utility: true } }),
      this.prisma.commission.aggregate({ where: { status: 'PENDIENTE' }, _sum: { amount: true } }),
    ]);
    return {
      clients: { total: totalClients, active: activeClients },
      assets: { total: totalAssets, active: activeAssets, maintenance: maintAssets, decommissioned: bajasAssets },
      tickets: { open: openTickets, critical: criticalTickets, pendingWilson },
      reports: { thisMonth: reportsThisMonth, total: totalReports },
      alerts: { warrantyExpiring, maintenanceDue: maintDue, unread: unreadAlerts },
      financials: { salesThisMonth: salesThisMonth._sum.salePrice||0, utilityThisMonth: salesThisMonth._sum.utility||0, pendingCommissions: pendingCommissions._sum.amount||0 },
    };
  }
  async getRecentActivity(limit = 10) { return this.prisma.maintenanceRecord.findMany({ take: Number(limit), orderBy: { createdAt: 'desc' }, include: { asset: { include: { client: true, assetType: true } }, technician: { select: { name: true } } } }); }
  async getWarrantyExpiring() { const in90 = new Date(Date.now()+90*86400000); return this.prisma.asset.findMany({ where: { warrantyUntil: { lte: in90 }, status: 'ACTIVO' }, include: { client: { select: { businessName: true } }, assetType: true }, orderBy: { warrantyUntil: 'asc' } }); }
  async getMaintenanceDue() { const in30 = new Date(Date.now()+30*86400000); return this.prisma.asset.findMany({ where: { nextMaintenance: { lte: in30 }, status: 'ACTIVO' }, include: { client: { select: { businessName: true } }, assetType: true }, orderBy: { nextMaintenance: 'asc' } }); }
  async getAssetsByType() { return this.prisma.assetType.findMany({ where: { isActive: true }, include: { _count: { select: { assets: true } } }, orderBy: { name: 'asc' } }); }
  async getAssetsByClient() { const c = await this.prisma.client.findMany({ where: { status: 'ACTIVO' }, include: { _count: { select: { assets: true } } }, orderBy: { businessName: 'asc' } }); return c.map(x => ({ id: x.id, name: x.businessName, count: x._count.assets })); }
}
