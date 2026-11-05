import { PrismaService } from '../common/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getKPIs(): Promise<{
        clients: {
            total: any;
            active: any;
        };
        assets: {
            total: any;
            active: any;
        };
        tickets: {
            open: any;
            critical: any;
            pendingWilson: any;
        };
        reports: {
            thisMonth: any;
        };
        alerts: {
            warrantyExpiring: any;
            maintenanceDue: any;
            unread: any;
        };
        financials: {
            salesThisMonth: any;
            utilityThisMonth: any;
            pendingCommissions: any;
            totalToCollect: any;
            pendientePorPagoValue: any;
        };
        ticketsByStatus: {
            NUEVO: any;
            EN_EJECUCION: any;
            POR_CONFIRMACION: any;
            PENDIENTE_WILSON: any;
            POR_FACTURACION: any;
            PENDIENTE_POR_PAGO: any;
            CERRADO: any;
        };
    }>;
    getRecentActivity(limit?: number): Promise<any>;
    getWarrantyExpiring(): Promise<any>;
    getMaintenanceDue(): Promise<any>;
    getAssetsByType(): Promise<any>;
    getAssetsByClient(): Promise<any>;
    getTechnicians(): Promise<any>;
    getFinancialSummary(query: any): Promise<{
        tickets: any;
        totalSales: any;
        totalCosts: any;
        totalUtility: any;
        totalCommissions: any;
        count: any;
    }>;
    getCommissions(query: any): Promise<{
        commissions: any;
        totalPending: any;
        totalPaid: any;
    }>;
    payCommission(id: string, notes?: string): Promise<any>;
    exportFinancials(query: any): Promise<any>;
    getClientSummary(clientId: string): Promise<{
        assets: {
            total: any;
            active: any;
        };
        tickets: {
            open: any;
        };
        reports: {
            total: any;
            recent: any;
        };
        alerts: {
            warrantyExpiring: any;
            maintenanceDue: any;
        };
        recentActivity: any;
    }>;
}
