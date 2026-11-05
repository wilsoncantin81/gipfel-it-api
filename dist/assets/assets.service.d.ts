import { PrismaService } from '../common/prisma.service';
export declare class AssetsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(q: any): Promise<{
        data: any;
        total: any;
    }>;
    findOne(id: string): Promise<any>;
    create(createAssetDto: any): Promise<any>;
    update(id: string, updateAssetDto: any): Promise<any>;
    remove(id: string): Promise<any>;
    private escapeCsv;
    getAssetPDF(id: string): Promise<string>;
    getQR(id: string): Promise<{
        code: any;
        qrCodeUrl: any;
        message: string;
    }>;
    getPassword(id: string): Promise<{
        code: any;
        password: string;
        hasPassword: boolean;
    }>;
    getRemotePassword(id: string): Promise<{
        code: any;
        password: string;
        hasPassword: boolean;
    }>;
    importFromExcel(rows: any[]): Promise<{
        created: number;
        failed: number;
        errors: any[];
    }>;
    exportPDF(q: any): Promise<string>;
    exportExcel(q: any): Promise<any>;
}
