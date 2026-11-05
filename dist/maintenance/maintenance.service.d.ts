import { PrismaService } from '../common/prisma.service';
export declare class MaintenanceService {
    private prisma;
    constructor(prisma: PrismaService);
    private parseDate;
    findAll(query: any): Promise<{
        data: any;
        total: any;
    }>;
    findByAsset(assetId: string, clientId?: string): Promise<any>;
    create(dto: any): Promise<any>;
    update(id: string, dto: any): Promise<any>;
    remove(id: string): Promise<any>;
    exportExcel(query: any): Promise<any>;
}
