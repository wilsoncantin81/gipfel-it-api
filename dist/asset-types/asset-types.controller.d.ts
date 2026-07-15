import { AssetTypesService } from './asset-types.service';
export declare class AssetTypesController {
    private readonly service;
    constructor(service: AssetTypesService);
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        _count: {
            assets: number;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        icon: string;
        fieldSchema: import("@prisma/client/runtime/library").JsonValue;
    })[]>;
    create(dto: any): import(".prisma/client").Prisma.Prisma__AssetTypeClient<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        icon: string;
        fieldSchema: import("@prisma/client/runtime/library").JsonValue;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, dto: any): import(".prisma/client").Prisma.Prisma__AssetTypeClient<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        icon: string;
        fieldSchema: import("@prisma/client/runtime/library").JsonValue;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__AssetTypeClient<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        icon: string;
        fieldSchema: import("@prisma/client/runtime/library").JsonValue;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
