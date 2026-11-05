import { ClientsService } from './clients.service';
export declare class ClientsController {
    private readonly service;
    constructor(service: ClientsService);
    getTechnicians(): Promise<any>;
    findAll(q: any, req: any): Promise<any[] | {
        data: any;
        total: any;
    }>;
    getStats(id: string, req: any): Promise<{
        assets: any;
        activeAssets: any;
        mantAssets: any;
        openTickets: any;
        reports: any;
    }>;
    findOne(id: string, req: any): Promise<any>;
    create(dto: any): Promise<any>;
    updateLogo(id: string, body: any): Promise<any>;
    update(id: string, dto: any): Promise<any>;
    remove(id: string): Promise<any>;
    private assertOwnClient;
}
