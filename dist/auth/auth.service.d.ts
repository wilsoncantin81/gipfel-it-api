import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service';
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    validateUser(email: string, password: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        user: {
            id: any;
            name: any;
            email: any;
            role: any;
            permissions: string[];
            clientId: any;
        };
    }>;
    register(dto: any): Promise<{
        id: any;
        name: any;
        email: any;
        role: any;
        clientId: any;
    }>;
    updateUser(id: string, dto: any): Promise<any>;
    getProfile(userId: string): Promise<any>;
    getUsers(): Promise<any>;
    getTechnicians(): Promise<any>;
    updatePermissions(id: string, permissions: string[]): Promise<any>;
    updateContact(id: string, dto: any): Promise<any>;
    resetPassword(id: string, password: string): Promise<{
        success: boolean;
    }>;
    updateStatus(id: string, isActive: boolean): Promise<any>;
    getDescargasSsoUrl(user: any): Promise<{
        url: string;
    }>;
}
