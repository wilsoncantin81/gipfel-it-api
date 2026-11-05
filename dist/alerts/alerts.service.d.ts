import { PrismaService } from '../common/prisma.service';
export declare class AlertsService {
    private prisma;
    constructor(prisma: PrismaService);
    generateAlerts(): Promise<{
        alertsCreated: number;
    }>;
    findAll(query: any): Promise<any>;
    markRead(id: string): Promise<any>;
    markAllRead(): Promise<any>;
    getUnreadCount(): Promise<{
        count: any;
    }>;
}
