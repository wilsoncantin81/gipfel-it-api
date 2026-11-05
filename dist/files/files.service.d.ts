import { PrismaService } from '../common/prisma.service';
export declare class FilesService {
    private prisma;
    private ftp;
    constructor(prisma: PrismaService);
    private getRemotePath;
    private getPublicUrl;
    private connectFTP;
    saveAssetFiles(assetId: string, files: Express.Multer.File[]): Promise<any[]>;
    getAssetFiles(assetId: string): Promise<any>;
    saveReportFiles(reportId: string, files: Express.Multer.File[]): Promise<any[]>;
    getReportFiles(reportId: string): Promise<any>;
    saveTicketFiles(ticketId: string, files: Express.Multer.File[]): Promise<any[]>;
    getTicketFiles(ticketId: string): Promise<any>;
    deleteFile(fileId: string): Promise<{
        success: boolean;
    }>;
    saveNoteFiles(noteId: string, clientId: string, files: Express.Multer.File[]): Promise<any[]>;
    getNoteFiles(noteId: string): Promise<any>;
    deleteNoteFile(fileId: string): Promise<{
        success: boolean;
    }>;
}
