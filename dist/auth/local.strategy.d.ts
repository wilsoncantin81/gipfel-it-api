import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';
declare const LocalStrategy_base: new (...args: any[]) => Strategy;
export declare class LocalStrategy extends LocalStrategy_base {
    private auth;
    constructor(auth: AuthService);
    validate(email: string, password: string): Promise<{
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
}
export {};
