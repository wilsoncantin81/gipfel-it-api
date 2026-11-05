import { Response } from 'express';
import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly service;
    constructor(service: ReportsService);
    findAll(q: any, req: any): Promise<any>;
    findOne(id: string, req: any): Promise<any>;
    create(dto: any, req: any): Promise<any>;
    update(id: string, dto: any, req: any): Promise<any>;
    getAuditLog(id: string, req: any): Promise<any>;
    saveSignature(id: string, body: any): Promise<any>;
    pdf(id: string, res: Response): Promise<void>;
    sendEmail(id: string, body: any): Promise<{
        sent: boolean;
        to: any;
    }>;
}
