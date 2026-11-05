"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const basic_ftp_1 = require("basic-ftp");
const stream_1 = require("stream");
let FilesService = class FilesService {
    constructor(prisma) {
        this.prisma = prisma;
        this.ftp = new basic_ftp_1.Client();
    }
    getRemotePath(filename) {
        const base = process.env.FTP_REMOTE_PATH || '/';
        const normalized = base.endsWith('/') ? base : `${base}/`;
        return `${normalized}${filename}`;
    }
    getPublicUrl(filename) {
        const base = process.env.FTP_BASE_URL || 'https://www.grupogipfel.com/uploads';
        const normalized = base.endsWith('/') ? base.slice(0, -1) : base;
        return `${normalized}/${filename}`;
    }
    async connectFTP() {
        if (!this.ftp.closed)
            return;
        await this.ftp.access({
            host: process.env.FTP_HOST || 'ftp.grupogipfel.com',
            user: process.env.FTP_USER || 'uploads@grupogipfel.com',
            password: process.env.FTP_PASS || '',
            port: 21,
        });
    }
    async saveAssetFiles(assetId, files) {
        const savedFiles = [];
        try {
            await this.connectFTP();
            for (const file of files) {
                const fileStream = stream_1.Readable.from(file.buffer);
                const storageName = `${Date.now()}-${file.originalname}`;
                await this.ftp.uploadFrom(fileStream, this.getRemotePath(storageName));
                const dbFile = await this.prisma.assetFile.create({
                    data: {
                        assetId,
                        filename: file.originalname,
                        storageName,
                        mimetype: file.mimetype,
                        size: file.size,
                        fileUrl: this.getPublicUrl(storageName),
                        uploadedAt: new Date(),
                    },
                });
                savedFiles.push(dbFile);
            }
        }
        catch (error) {
            throw new Error(`Error uploading files: ${error.message}`);
        }
        finally {
            if (!this.ftp.closed)
                await this.ftp.close();
        }
        return savedFiles;
    }
    async getAssetFiles(assetId) {
        return await this.prisma.assetFile.findMany({
            where: { assetId },
            orderBy: { uploadedAt: 'desc' },
        });
    }
    async saveReportFiles(reportId, files) {
        const savedFiles = [];
        try {
            await this.connectFTP();
            for (const file of files) {
                const fileStream = stream_1.Readable.from(file.buffer);
                const storageName = `${Date.now()}-${file.originalname}`;
                await this.ftp.uploadFrom(fileStream, this.getRemotePath(storageName));
                const dbFile = await this.prisma.assetFile.create({
                    data: {
                        reportId,
                        filename: file.originalname,
                        storageName,
                        mimetype: file.mimetype,
                        size: file.size,
                        fileUrl: this.getPublicUrl(storageName),
                        uploadedAt: new Date(),
                    },
                });
                savedFiles.push(dbFile);
            }
        }
        catch (error) {
            throw new Error(`Error uploading files: ${error.message}`);
        }
        finally {
            if (!this.ftp.closed)
                await this.ftp.close();
        }
        return savedFiles;
    }
    async getReportFiles(reportId) {
        return await this.prisma.assetFile.findMany({
            where: { reportId },
            orderBy: { uploadedAt: 'desc' },
        });
    }
    async saveTicketFiles(ticketId, files) {
        const savedFiles = [];
        try {
            await this.connectFTP();
            for (const file of files) {
                const fileStream = stream_1.Readable.from(file.buffer);
                const storageName = `${Date.now()}-${file.originalname}`;
                await this.ftp.uploadFrom(fileStream, this.getRemotePath(storageName));
                const dbFile = await this.prisma.assetFile.create({
                    data: {
                        ticketId,
                        filename: file.originalname,
                        storageName,
                        mimetype: file.mimetype,
                        size: file.size,
                        fileUrl: this.getPublicUrl(storageName),
                        uploadedAt: new Date(),
                    },
                });
                savedFiles.push(dbFile);
            }
        }
        catch (error) {
            throw new Error(`Error uploading files: ${error.message}`);
        }
        finally {
            if (!this.ftp.closed)
                await this.ftp.close();
        }
        return savedFiles;
    }
    async getTicketFiles(ticketId) {
        return await this.prisma.assetFile.findMany({
            where: { ticketId },
            orderBy: { uploadedAt: 'desc' },
        });
    }
    async deleteFile(fileId) {
        const file = await this.prisma.assetFile.findUnique({ where: { id: fileId } });
        if (!file)
            throw new Error('File not found');
        try {
            await this.connectFTP();
            await this.ftp.remove(this.getRemotePath(file.storageName));
        }
        catch (error) {
            console.error('Error deleting from FTP:', error);
        }
        finally {
            if (!this.ftp.closed)
                await this.ftp.close();
        }
        await this.prisma.assetFile.delete({ where: { id: fileId } });
        return { success: true };
    }
    async saveNoteFiles(noteId, clientId, files) {
        const savedFiles = [];
        try {
            await this.connectFTP();
            for (const file of files) {
                const fileStream = stream_1.Readable.from(file.buffer);
                const storageName = `note-${Date.now()}-${file.originalname}`;
                await this.ftp.uploadFrom(fileStream, this.getRemotePath(storageName));
                const url = this.getPublicUrl(storageName);
                const dbFile = await this.prisma.clientNoteFile.create({
                    data: { noteId, clientId, filename: file.originalname, url, mimeType: file.mimetype, size: file.size },
                });
                savedFiles.push(dbFile);
            }
        }
        catch (error) {
            console.error('saveNoteFiles error:', error);
            throw new Error(`Error uploading files: ${error.message}`);
        }
        finally {
            if (!this.ftp.closed)
                await this.ftp.close();
        }
        return savedFiles;
    }
    async getNoteFiles(noteId) {
        return this.prisma.clientNoteFile.findMany({
            where: { noteId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async deleteNoteFile(fileId) {
        const file = await this.prisma.clientNoteFile.findUnique({ where: { id: fileId } });
        if (file) {
            const storageName = file.url.split('/').pop();
            try {
                await this.connectFTP();
                await this.ftp.remove(this.getRemotePath(storageName));
            }
            catch { }
            finally {
                if (!this.ftp.closed)
                    await this.ftp.close();
            }
            await this.prisma.clientNoteFile.delete({ where: { id: fileId } });
        }
        return { success: true };
    }
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FilesService);
//# sourceMappingURL=files.service.js.map