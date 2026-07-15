import { TicketsService } from './tickets.service';
export declare class TicketsController {
    private readonly service;
    constructor(service: TicketsService);
    findAll(q: any, req: any): Promise<({
        client: {
            id: string;
            businessName: string;
        };
        _count: {
            tasks: number;
            expenses: number;
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
    })[]>;
    getTask(id: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        order: number;
        ticketId: string;
        done: boolean;
    }>;
    getSummary(id: string): Promise<{
        expenses: {
            id: string;
            createdAt: Date;
            total: number;
            supplier: string | null;
            date: Date;
            description: string;
            ticketId: string;
            supplierInvoice: string | null;
            quantity: number;
            unitPrice: number;
        }[];
        totalCost: number;
        salePrice: number;
        utility: number;
        commission: number;
    }>;
    findOne(id: string, req: any): Promise<{
        statusLogs: any;
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
        commission: {
            user: {
                id: string;
                name: string;
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
        };
        assignedTo: {
            id: string;
            email: string;
            name: string;
        };
        report: {
            id: string;
            date: Date;
            reportNumber: string;
        };
        tasks: {
            id: string;
            createdAt: Date;
            title: string;
            order: number;
            ticketId: string;
            done: boolean;
        }[];
        expenses: {
            id: string;
            createdAt: Date;
            total: number;
            supplier: string | null;
            date: Date;
            description: string;
            ticketId: string;
            supplierInvoice: string | null;
            quantity: number;
            unitPrice: number;
        }[];
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
    }>;
    create(dto: any, req: any): Promise<{
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
    }>;
    addTask(id: string, body: any): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        order: number;
        ticketId: string;
        done: boolean;
    }>;
    addExpense(id: string, dto: any): Promise<{
        id: string;
        createdAt: Date;
        total: number;
        supplier: string | null;
        date: Date;
        description: string;
        ticketId: string;
        supplierInvoice: string | null;
        quantity: number;
        unitPrice: number;
    }>;
    toggleTask(id: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        order: number;
        ticketId: string;
        done: boolean;
    }>;
    updateStatus(id: string, body: any, req: any): Promise<{
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
    }>;
    update(id: string, dto: any): Promise<{
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
    }>;
    deleteTask(id: string): Promise<{
        deleted: boolean;
    }>;
    deleteExpense(id: string): Promise<{
        deleted: boolean;
    }>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
    private assertOwnTicket;
}
