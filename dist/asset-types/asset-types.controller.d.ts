import { AssetTypesService } from './asset-types.service';
export declare class AssetTypesController {
    private readonly service;
    constructor(service: AssetTypesService);
    findAll(): any;
    create(dto: any): any;
    update(id: string, dto: any): any;
    remove(id: string): any;
}
