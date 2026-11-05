import { AlertsService } from './alerts.service';
export declare class AlertsController {
    private readonly service;
    constructor(service: AlertsService);
    findAll(q: any): Promise<any>;
    getCount(): Promise<{
        count: any;
    }>;
    markAllRead(): Promise<any>;
    markRead(id: string): Promise<any>;
    generate(): Promise<{
        alertsCreated: number;
    }>;
}
