import { PrismaService } from '../common/prisma.service';
export declare class FinancialsService {
    private prisma;
    constructor(prisma: PrismaService);
    getSummary(query: any): Promise<{
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
    getCommissions(query: any): Promise<{
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
    payCommission(id: string, notes?: string): Promise<{
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
    payAllCommissions(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getTechnicians(): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.UserRole;
    }[]>;
    exportExcel(query: any): Promise<any>;
}
