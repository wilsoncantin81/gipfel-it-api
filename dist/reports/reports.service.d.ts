import { PrismaService } from '../common/prisma.service';
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    private parseDate;
    findAll(q: any): Promise<({
        client: {
            id: string;
            businessName: string;
        };
        assets: ({
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
        } & {
            assetId: string;
            reportId: string;
            workDetail: string | null;
        })[];
        technician: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        clientId: string;
        createdAt: Date;
        updatedAt: Date;
        technicianId: string | null;
        date: Date;
        description: string;
        conclusion: string | null;
        reportNumber: string;
        serviceType: import(".prisma/client").$Enums.ServiceType;
        observations: string | null;
        timeUsed: number | null;
        signatureUrl: string | null;
        pdfUrl: string | null;
        sentAt: Date | null;
    })[]>;
    findOne(id: string): Promise<{
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
        assets: ({
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
        } & {
            assetId: string;
            reportId: string;
            workDetail: string | null;
        })[];
        technician: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        clientId: string;
        createdAt: Date;
        updatedAt: Date;
        technicianId: string | null;
        date: Date;
        description: string;
        conclusion: string | null;
        reportNumber: string;
        serviceType: import(".prisma/client").$Enums.ServiceType;
        observations: string | null;
        timeUsed: number | null;
        signatureUrl: string | null;
        pdfUrl: string | null;
        sentAt: Date | null;
    }>;
    create(dto: any): Promise<{
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
        technician: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        clientId: string;
        createdAt: Date;
        updatedAt: Date;
        technicianId: string | null;
        date: Date;
        description: string;
        conclusion: string | null;
        reportNumber: string;
        serviceType: import(".prisma/client").$Enums.ServiceType;
        observations: string | null;
        timeUsed: number | null;
        signatureUrl: string | null;
        pdfUrl: string | null;
        sentAt: Date | null;
    }>;
    saveSignature(id: string, signature: string): Promise<{
        id: string;
        clientId: string;
        createdAt: Date;
        updatedAt: Date;
        technicianId: string | null;
        date: Date;
        description: string;
        conclusion: string | null;
        reportNumber: string;
        serviceType: import(".prisma/client").$Enums.ServiceType;
        observations: string | null;
        timeUsed: number | null;
        signatureUrl: string | null;
        pdfUrl: string | null;
        sentAt: Date | null;
    }>;
    private fetchImageBuffer;
    getPDF(id: string): Promise<Buffer<ArrayBufferLike>>;
    sendEmail(id: string, toEmail?: string, cc?: string): Promise<{
        sent: boolean;
        to: any;
    }>;
    buildHtml(rpt: any): string;
}
