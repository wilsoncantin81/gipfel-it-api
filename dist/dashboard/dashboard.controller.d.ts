import { Response } from 'express';
import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly service;
    constructor(service: DashboardService);
    getKPIs(): Promise<{
        clients: {
            total: number;
            active: number;
        };
        assets: {
            total: number;
            active: number;
        };
        tickets: {
            open: number;
            critical: number;
            pendingWilson: number;
        };
        reports: {
            thisMonth: number;
        };
        alerts: {
            warrantyExpiring: number;
            maintenanceDue: number;
            unread: number;
        };
        financials: {
            salesThisMonth: number;
            utilityThisMonth: number;
            pendingCommissions: number;
        };
        ticketsByStatus: {
            NUEVO: number;
            EN_EJECUCION: number;
            POR_CONFIRMACION: number;
            PENDIENTE_WILSON: number;
            POR_FACTURACION: number;
            CERRADO: number;
        };
    }>;
    getActivity(limit: string): Promise<({
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
    getWarranty(): Promise<({
        client: {
            businessName: string;
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
    })[]>;
    getMaintenance(): Promise<({
        client: {
            businessName: string;
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
    })[]>;
    getByType(): Promise<({
        _count: {
            assets: number;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        icon: string;
        fieldSchema: import("@prisma/client/runtime/library").JsonValue;
    })[]>;
    getByClient(): Promise<{
        id: string;
        name: string;
        count: number;
    }[]>;
    getTechnicians(): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.UserRole;
    }[]>;
    getFinancialSummary(q: any): Promise<{
        tickets: ({
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
            commission: {
                id: string;
                createdAt: Date;
                status: import(".prisma/client").$Enums.CommissionStatus;
                notes: string | null;
                ticketId: string;
                userId: string;
                amount: number;
                percentage: number;
                paidAt: Date | null;
            };
            assignedTo: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            clientId: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.TicketStatus;
            assetId: string | null;
            description: string | null;
            reportId: string | null;
            priority: import(".prisma/client").$Enums.Priority;
            ticketNumber: string;
            assignedToId: string | null;
            title: string;
            conclusion: string | null;
            invoiceNumber: string | null;
            closureType: string | null;
            salePrice: number | null;
            totalCost: number | null;
            utility: number | null;
            slaHours: number | null;
            resolvedAt: Date | null;
        })[];
        totalSales: number;
        totalCosts: number;
        totalUtility: number;
        totalCommissions: number;
        count: number;
    }>;
    getCommissions(q: any): Promise<{
        commissions: ({
            user: {
                id: string;
                email: string;
                name: string;
            };
            ticket: {
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
                clientId: string;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.TicketStatus;
                assetId: string | null;
                description: string | null;
                reportId: string | null;
                priority: import(".prisma/client").$Enums.Priority;
                ticketNumber: string;
                assignedToId: string | null;
                title: string;
                conclusion: string | null;
                invoiceNumber: string | null;
                closureType: string | null;
                salePrice: number | null;
                totalCost: number | null;
                utility: number | null;
                slaHours: number | null;
                resolvedAt: Date | null;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.CommissionStatus;
            notes: string | null;
            ticketId: string;
            userId: string;
            amount: number;
            percentage: number;
            paidAt: Date | null;
        })[];
        totalPending: number;
        totalPaid: number;
    }>;
    payCommission(id: string, body: any): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.CommissionStatus;
        notes: string | null;
        ticketId: string;
        userId: string;
        amount: number;
        percentage: number;
        paidAt: Date | null;
    }>;
    exportFinancials(q: any, res: Response): Promise<void>;
}
