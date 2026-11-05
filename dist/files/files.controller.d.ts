import { FilesService } from './files.service';
export declare class FilesController {
    private readonly filesService;
    constructor(filesService: FilesService);
    uploadAssetFiles(assetId: string, files: Express.Multer.File[]): Promise<{
        success: boolean;
        files: any[];
    }>;
    getAssetFiles(assetId: string): Promise<any>;
    uploadReportFiles(reportId: string, files: Express.Multer.File[]): Promise<{
        success: boolean;
        files: any[];
    }>;
    getReportFiles(reportId: string): Promise<any>;
    uploadTicketFiles(ticketId: string, files: Express.Multer.File[]): Promise<{
        success: boolean;
        files: any[];
    }>;
    getTicketFiles(ticketId: string): Promise<any>;
    deleteFile(fileId: string): Promise<{
        success: boolean;
    }>;
    uploadNoteFiles(noteId: string, files: Express.Multer.File[]): Promise<any[]>;
    getNoteFiles(noteId: string): Promise<any>;
    deleteNoteFile(fileId: string): Promise<{
        success: boolean;
    }>;
}
