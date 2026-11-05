import { PrismaService } from '../common/prisma.service';
export declare class FinancialsService {
    private prisma;
    constructor(prisma: PrismaService);
    getSummary(query: any): Promise<{
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
    payAllCommissions(userId: string): Promise<any>;
    getTechnicians(): Promise<any>;
    exportExcel(query: any): Promise<any>;
}
