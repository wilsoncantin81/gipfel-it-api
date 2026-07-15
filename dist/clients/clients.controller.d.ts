import { ClientsService } from './clients.service';
export declare class ClientsController {
    private readonly service;
    constructor(service: ClientsService);
    getTechnicians(): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.UserRole;
    }[]>;
    findAll(q: any, req: any): Promise<({
        _count: {
            tickets: number;
            reports: number;
            assets: number;
        };
        assets: ({
            assetType: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                icon: string;
                fieldSchema: import("@prisma/client/runtime/library").JsonValue;
            };
        } & {
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
        })[];
    } & {
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
    })[] | {
        data: ({
            _count: {
                assets: number;
            };
        } & {
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
        })[];
        total: number;
    }>;
    getStats(id: string, req: any): Promise<{
        assets: number;
        activeAssets: number;
        mantAssets: number;
        openTickets: number;
        reports: number;
    }>;
    findOne(id: string, req: any): Promise<{
        _count: {
            tickets: number;
            reports: number;
            assets: number;
        };
        assets: ({
            assetType: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                icon: string;
                fieldSchema: import("@prisma/client/runtime/library").JsonValue;
            };
        } & {
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
        })[];
    } & {
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
    }>;
    create(dto: any): Promise<{
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
    }>;
    updateLogo(id: string, body: any): Promise<{
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
    }>;
    update(id: string, dto: any): Promise<{
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
    }>;
    remove(id: string): Promise<{
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
    }>;
    private assertOwnClient;
}
