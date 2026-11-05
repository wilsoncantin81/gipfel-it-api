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
            clientId: any;
        };
    }>;
    technicians(): Promise<any>;
    getUsers(): Promise<any>;
    register(body: any): Promise<{
        id: any;
        name: any;
        email: any;
        role: any;
        clientId: any;
    }>;
    updateUser(id: string, body: any): Promise<any>;
    updatePermissions(id: string, body: any): Promise<any>;
    updateContact(id: string, body: any): Promise<any>;
    resetPassword(id: string, body: any): Promise<{
        success: boolean;
    }>;
    updateStatus(id: string, body: any): Promise<any>;
    profile(req: any): Promise<any>;
    descargasSso(req: any): Promise<{
        url: string;
    }>;
}
