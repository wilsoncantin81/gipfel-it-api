import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getKPIs() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const in90 = new Date(now.getTime() + 90 * 86400000);
    const in30 = new Date(now.getTime() + 30 * 86400000);
    const [totalClients, activeClients, totalAssets, activeAssets, maintAssets, bajasAssets, openTickets, criticalTickets, reportsThisMonth, totalReports, warrantyExpiring, maintDue, unreadAlerts] = await Promise.all([
      this.prisma.client.count(),
      this.prisma.client.count({ where: { status: 'ACTIVO' } }),
      this.prisma.asset.count(),
      this.prisma.asset.count({ where: { status: 'ACTIVO' } }),
      this.prisma.asset.count({ where: { status: 'EN_MANTENIMIENTO' } }),
      this.prisma.asset.count({ where: { status: 'DADO_DE_BAJA' } }),
      this.prisma.ticket.count({ where: { status: { not: 'CERRADO' } } }),
      this.prisma.ticket.count({ where: { status: { not: 'CERRADO' }, priority: 'CRITICA' } }),
      this.prisma.serviceReport.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.serviceReport.count(),
      this.prisma.asset.count({ where: { warrantyUntil: { lte: in90, gte: now }, status: 'ACTIVO' } }),
      this.prisma.asset.count({ where: { nextMaintenance: { lte: in30, gte: now }, status: 'ACTIVO' } }),
      this.prisma.alert.count({ where: { isRead: false } }),
    ]);
    return {
      clients: { total: totalClients, active: activeClients, inactive: totalClients - activeClients },
      assets: { total: totalAssets, active: activeAssets, maintenance: maintAssets, decommissioned: bajasAssets },
      tickets: { open: openTickets, critical: criticalTickets },
      reports: { thisMonth: reportsThisMonth, total: totalReports },
      alerts: { warrantyExpiring, maintenanceDue: maintDue, unread: unreadAlerts },
    };
  }

  async getRecentActivity(limit = 10) {
    return this.prisma.maintenanceRecord.findMany({
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { asset: { include: { client: true, assetType: true } }, technician: { select: { name: true } } },
    });
  }

  async getWarrantyExpiring() {
    const in90 = new Date(Date.now() + 90 * 86400000);
    return this.prisma.asset.findMany({ where: { warrantyUntil: { lte: in90 }, status: 'ACTIVO' }, include: { client: { select: { businessName: true } }, assetType: true }, orderBy: { warrantyUntil: 'asc' } });
  }

  async getMaintenanceDue() {
    const in30 = new Date(Date.now() + 30 * 86400000);
    return this.prisma.asset.findMany({ where: { nextMaintenance: { lte: in30 }, status: 'ACTIVO' }, include: { client: { select: { businessName: true } }, assetType: true }, orderBy: { nextMaintenance: 'asc' } });
  }

  async getAssetsByType() {
    return this.prisma.assetType.findMany({ where: { isActive: true }, include: { _count: { select: { assets: true } } }, orderBy: { name: 'asc' } });
  }

  async getAssetsByClient() {
    const clients = await this.prisma.client.findMany({ where: { status: 'ACTIVO' }, include: { _count: { select: { assets: true } } }, orderBy: { businessName: 'asc' } });
    return clients.map(c => ({ id: c.id, name: c.businessName, count: c._count.assets }));
  }
}
