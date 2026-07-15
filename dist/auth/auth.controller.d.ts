import { AuthService } from './auth.service';
export declare class AuthController {
    private auth;
    constructor(auth: AuthService);
    login(req: any): Promise<{
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
    technicians(): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.UserRole;
    }[]>;
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
    register(body: any): Promise<{
        id: string;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        clientId: string;
    }>;
    updatePermissions(id: string, body: any): Promise<{
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
    updateContact(id: string, body: any): Promise<{
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
    resetPassword(id: string, body: any): Promise<{
        success: boolean;
    }>;
    updateStatus(id: string, body: any): Promise<{
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
    profile(req: any): Promise<{
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
}
