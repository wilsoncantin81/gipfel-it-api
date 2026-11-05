import { TicketsService } from './tickets.service';
export declare class TicketsController {
    private readonly service;
    constructor(service: TicketsService);
    findAll(q: any, req: any): Promise<any>;
    getTask(id: string): Promise<any>;
    getSummary(id: string): Promise<{
        expenses: any;
        totalCost: any;
        salePrice: any;
        utility: number;
        commission: number;
    }>;
    findOne(id: string, req: any): Promise<any>;
    create(dto: any, req: any): Promise<any>;
    addTask(id: string, body: any): Promise<any>;
    addExpense(id: string, dto: any): Promise<any>;
    toggleTask(id: string): Promise<any>;
    updateStatus(id: string, body: any, req: any): Promise<any>;
    updateBilling(id: string, dto: any): Promise<any>;
    update(id: string, dto: any): Promise<any>;
    deleteTask(id: string): Promise<{
        deleted: boolean;
    }>;
    deleteExpense(id: string): Promise<{
        deleted: boolean;
    }>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
}
