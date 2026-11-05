import { PrismaService } from '../common/prisma.service';
export declare class TicketsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(q: any): Promise<any>;
    findOne(id: string): Promise<any>;
    getTask(id: string): Promise<any>;
    getExpenseSummary(id: string): Promise<{
        expenses: any;
        totalCost: any;
        salePrice: any;
        utility: number;
        commission: number;
    }>;
    create(dto: any): Promise<any>;
    update(id: string, dto: any): Promise<any>;
    private parseDate;
    private logStatusChange;
    updateStatus(id: string, body: any, userId?: string): Promise<any>;
    updateBilling(id: string, body: any): Promise<any>;
    getStatusLogs(id: string): Promise<any[]>;
    addTask(ticketId: string, title: string): Promise<any>;
    toggleTask(id: string): Promise<any>;
    deleteTask(id: string): Promise<{
        deleted: boolean;
    }>;
    addExpense(ticketId: string, dto: any): Promise<any>;
    deleteExpense(id: string): Promise<{
        deleted: boolean;
    }>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
}
