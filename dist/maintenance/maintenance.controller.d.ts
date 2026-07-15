import { Response } from 'express';
import { MaintenanceService } from './maintenance.service';
export declare class MaintenanceController {
    private readonly service;
    constructor(service: MaintenanceService);
    findAll(q: any): Promise<{
        data: ({
            asset: {
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
            };
            technician: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            assetId: string;
            technicianId: string | null;
            date: Date;
            type: import(".prisma/client").$Enums.MaintenanceType;
            description: string;
            workDone: string | null;
            parts: import("@prisma/client/runtime/library").JsonValue | null;
            timeSpent: number | null;
            nextMaint: Date | null;
            reportId: string | null;
        })[];
        total: number;
    }>;
    findByAsset(id: string): Promise<({
        technician: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        assetId: string;
        technicianId: string | null;
        date: Date;
        type: import(".prisma/client").$Enums.MaintenanceType;
        description: string;
        workDone: string | null;
        parts: import("@prisma/client/runtime/library").JsonValue | null;
        timeSpent: number | null;
        nextMaint: Date | null;
        reportId: string | null;
    })[]>;
    export(q: any, res: Response): Promise<void>;
    create(dto: any): Promise<{
        asset: {
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
        };
        technician: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        assetId: string;
        technicianId: string | null;
        date: Date;
        type: import(".prisma/client").$Enums.MaintenanceType;
        description: string;
        workDone: string | null;
        parts: import("@prisma/client/runtime/library").JsonValue | null;
        timeSpent: number | null;
        nextMaint: Date | null;
        reportId: string | null;
    }>;
    update(id: string, dto: any): Promise<{
        id: string;
        createdAt: Date;
        assetId: string;
        technicianId: string | null;
        date: Date;
        type: import(".prisma/client").$Enums.MaintenanceType;
        description: string;
        workDone: string | null;
        parts: import("@prisma/client/runtime/library").JsonValue | null;
        timeSpent: number | null;
        nextMaint: Date | null;
        reportId: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        assetId: string;
        technicianId: string | null;
        date: Date;
        type: import(".prisma/client").$Enums.MaintenanceType;
        description: string;
        workDone: string | null;
        parts: import("@prisma/client/runtime/library").JsonValue | null;
        timeSpent: number | null;
        nextMaint: Date | null;
        reportId: string | null;
    }>;
}
