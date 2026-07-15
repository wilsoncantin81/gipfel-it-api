import { PrismaService } from '../common/prisma.service';
export declare class FilesService {
    private prisma;
    private ftp;
    constructor(prisma: PrismaService);
    private getRemotePath;
    private getPublicUrl;
    private connectFTP;
    saveAssetFiles(assetId: string, files: Express.Multer.File[]): Promise<any[]>;
    getAssetFiles(assetId: string): Promise<{
        id: string;
        size: number;
        assetId: string;
        filename: string;
        storageName: string;
        mimetype: string;
        fileUrl: string;
        uploadedAt: Date;
    }[]>;
    deleteFile(fileId: string): Promise<{
        success: boolean;
    }>;
}
