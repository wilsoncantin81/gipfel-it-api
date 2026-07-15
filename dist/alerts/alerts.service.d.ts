import { PrismaService } from '../common/prisma.service';
export declare class AlertsService {
    private prisma;
    constructor(prisma: PrismaService);
    generateAlerts(): Promise<{
        alertsCreated: number;
    }>;
    findAll(query: any): Promise<({
        client: {
            id: string;
            email: string | null;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
            nit: string | null;
            businessName: string;
            address: string | null;
            branch: string | null;
            city: string | null;
            contactName: string | null;
            logoUrl: string | null;
            status: import(".prisma/client").$Enums.ClientStatus;
        };
        asset: {
            id: string;
            name: string;
            clientId: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.AssetStatus;
            assetTypeId: string;
            code: string | null;
            brand: string | null;
            model: string | null;
            serial: string | null;
            purchaseDate: Date | null;
            warrantyUntil: Date | null;
            supplier: string | null;
            assignedUser: string | null;
            responsible: string | null;
            passwordEnc: string | null;
            remoteAccess: string | null;
            ipAddress: string | null;
            macAddress: string | null;
            location: string | null;
            dynFields: import("@prisma/client/runtime/library").JsonValue;
            extraFields: import("@prisma/client/runtime/library").JsonValue;
            nextMaintenance: Date | null;
            qrCodeUrl: string | null;
            notes: string | null;
        };
    } & {
        id: string;
        clientId: string | null;
        createdAt: Date;
        assetId: string | null;
        type: import(".prisma/client").$Enums.AlertType;
        message: string;
        dueDate: Date | null;
        isRead: boolean;
    })[]>;
    markRead(id: string): Promise<{
        id: string;
        clientId: string | null;
        createdAt: Date;
        assetId: string | null;
        type: import(".prisma/client").$Enums.AlertType;
        message: string;
        dueDate: Date | null;
        isRead: boolean;
    }>;
    markAllRead(): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getUnreadCount(): Promise<{
        count: number;
    }>;
}
