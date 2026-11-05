import { Response } from 'express';
import { AssetsService } from './assets.service';
import { PrismaService } from '../common/prisma.service';
export declare class AssetsController {
    private readonly service;
    private readonly prisma;
    constructor(service: AssetsService, prisma: PrismaService);
    findAll(q: any, req: any): Promise<{
        data: any;
        total: any;
    }>;
    exportExcel(q: any, res: Response, req: any): Promise<void>;
    exportPDF(q: any, res: Response, req: any): Promise<void>;
    getAssetPDF(id: string, res: Response, req: any): Promise<void>;
    getQR(id: string, req: any): Promise<{
        code: any;
        qrCodeUrl: any;
        message: string;
    }>;
    getPassword(id: string, req: any): Promise<{
        code: any;
        password: string;
        hasPassword: boolean;
    }>;
    getRemotePassword(id: string, req: any): Promise<{
        code: any;
        password: string;
        hasPassword: boolean;
    }>;
    findOne(id: string, req: any): Promise<any>;
    create(dto: any, req: any): Promise<any>;
    update(id: string, dto: any, req: any): Promise<any>;
    remove(id: string, req: any): Promise<any>;
    importExcel(body: any, req: any): Promise<{
        created: number;
        failed: number;
        errors: any[];
    }>;
}
