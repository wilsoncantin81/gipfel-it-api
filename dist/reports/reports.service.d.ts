import { PrismaService } from '../common/prisma.service';
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    private parseDate;
    findAll(q: any): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: any, userId?: string): Promise<any>;
    getAuditLog(id: string): Promise<any>;
    create(dto: any): Promise<any>;
    saveSignature(id: string, signature: string): Promise<any>;
    private fetchImageBuffer;
    getPDF(id: string): Promise<Buffer<ArrayBufferLike>>;
    sendEmail(id: string, toEmail?: string, cc?: string): Promise<{
        sent: boolean;
        to: any;
    }>;
    buildHtml(rpt: any): string;
}
