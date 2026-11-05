import { PrismaService } from '../common/prisma.service';
export declare class ClientsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: any): Promise<{
        data: any;
        total: any;
    }>;
    findOne(id: string): Promise<any>;
    create(dto: any): Promise<any>;
    update(id: string, dto: any): Promise<any>;
    remove(id: string): Promise<any>;
    updateLogo(id: string, logoUrl: string): Promise<any>;
    getStats(id: string): Promise<{
        assets: any;
        activeAssets: any;
        mantAssets: any;
        openTickets: any;
        reports: any;
    }>;
    getTechnicians(): Promise<any>;
}
