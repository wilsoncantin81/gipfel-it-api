import { Response } from 'express';
import { FinancialsService } from './financials.service';
export declare class FinancialsController {
    private readonly service;
    constructor(service: FinancialsService);
    getSummary(q: any): Promise<{
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
    getTechnicians(): Promise<any>;
    payCommission(id: string, body: any): Promise<any>;
    payAll(userId: string): Promise<any>;
    export(q: any, res: Response): Promise<void>;
}
