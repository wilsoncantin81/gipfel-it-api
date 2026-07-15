import { FilesService } from './files.service';
export declare class FilesController {
    private readonly filesService;
    constructor(filesService: FilesService);
    uploadAssetFiles(assetId: string, files: Express.Multer.File[]): Promise<{
        success: boolean;
        files: any[];
    }>;
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
