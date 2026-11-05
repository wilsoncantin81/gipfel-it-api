import { Response } from 'express';
import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly service;
    constructor(service: DashboardService);
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
    getClientSummary(req: any): Promise<{
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
    getActivity(limit: string): Promise<any>;
    getWarranty(): Promise<any>;
    getMaintenance(): Promise<any>;
    getByType(): Promise<any>;
    getByClient(): Promise<any>;
    getTechnicians(): Promise<any>;
    getFinancialSummary(q: any): Promise<{
        tickets: any;
        totalSales: any;
        totalCosts: any;
        totalUtility: any;
        totalCommissions: any;
        count: any;
    }>;
    getCommissions(q: any): Promise<{
        commissions: any;
        totalPending: any;
        totalPaid: any;
    }>;
    payCommission(id: string, body: any): Promise<any>;
    exportFinancials(q: any, res: Response): Promise<void>;
}
