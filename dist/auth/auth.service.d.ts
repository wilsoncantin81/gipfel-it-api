import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service';
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    validateUser(email: string, password: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        permissions: import("@prisma/client/runtime/library").JsonValue | null;
        phone: string | null;
        whatsappApiKey: string | null;
        clientId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    login(user: any): Promise<{
        access_token: string;
        user: {
            id: any;
            name: any;
            email: any;
            role: any;
            permissions: string[];
            clientId: string;
        };
    }>;
    register(dto: any): Promise<{
        id: string;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        clientId: string;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        phone: string;
        whatsappApiKey: string;
        clientId: string;
    }>;
    getUsers(): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        phone: string;
        whatsappApiKey: string;
        clientId: string;
    }[]>;
    getTechnicians(): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.UserRole;
    }[]>;
    updatePermissions(id: string, permissions: string[]): Promise<{
        id: string;
        email: string;
        name: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        permissions: import("@prisma/client/runtime/library").JsonValue | null;
        phone: string | null;
        whatsappApiKey: string | null;
        clientId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateContact(id: string, dto: any): Promise<{
        id: string;
        email: string;
        name: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        permissions: import("@prisma/client/runtime/library").JsonValue | null;
        phone: string | null;
        whatsappApiKey: string | null;
        clientId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    resetPassword(id: string, password: string): Promise<{
        success: boolean;
    }>;
    updateStatus(id: string, isActive: boolean): Promise<{
        id: string;
        email: string;
        name: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        permissions: import("@prisma/client/runtime/library").JsonValue | null;
        phone: string | null;
        whatsappApiKey: string | null;
        clientId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
