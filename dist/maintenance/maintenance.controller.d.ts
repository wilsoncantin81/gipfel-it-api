import { Response } from 'express';
import { MaintenanceService } from './maintenance.service';
export declare class MaintenanceController {
    private readonly service;
    constructor(service: MaintenanceService);
    findAll(q: any, req: any): Promise<{
        data: any;
        total: any;
    }>;
    findByAsset(id: string, req: any): Promise<any>;
    export(q: any, res: Response, req: any): Promise<void>;
    create(dto: any, req: any): Promise<any>;
    update(id: string, dto: any, req: any): Promise<any>;
    remove(id: string, req: any): Promise<any>;
}
