import { PrismaService } from '../common/prisma.service';
export declare class AssetTypesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): any;
    create(dto: any): any;
    update(id: string, dto: any): any;
    remove(id: string): any;
}
