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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const files_service_1 = require("./files.service");
const storage = (0, multer_1.memoryStorage)();
let FilesController = class FilesController {
    constructor(filesService) {
        this.filesService = filesService;
    }
    async uploadAssetFiles(assetId, files) {
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('No files provided');
        }
        const savedFiles = await this.filesService.saveAssetFiles(assetId, files);
        return { success: true, files: savedFiles };
    }
    async getAssetFiles(assetId) {
        return await this.filesService.getAssetFiles(assetId);
    }
    async uploadReportFiles(reportId, files) {
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('No files provided');
        }
        const savedFiles = await this.filesService.saveReportFiles(reportId, files);
        return { success: true, files: savedFiles };
    }
    async getReportFiles(reportId) {
        return await this.filesService.getReportFiles(reportId);
    }
    async uploadTicketFiles(ticketId, files) {
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('No files provided');
        }
        const savedFiles = await this.filesService.saveTicketFiles(ticketId, files);
        return { success: true, files: savedFiles };
    }
    async getTicketFiles(ticketId) {
        return await this.filesService.getTicketFiles(ticketId);
    }
    async deleteFile(fileId) {
        return await this.filesService.deleteFile(fileId);
    }
    async uploadNoteFiles(noteId, files) {
        if (!files || files.length === 0)
            throw new common_1.BadRequestException('No files provided');
        const clientId = files[0]?.fieldname || '';
        return await this.filesService.saveNoteFiles(noteId, clientId, files);
    }
    async getNoteFiles(noteId) {
        return await this.filesService.getNoteFiles(noteId);
    }
    async deleteNoteFile(fileId) {
        return await this.filesService.deleteNoteFile(fileId);
    }
};
exports.FilesController = FilesController;
__decorate([
    (0, common_1.Post)('asset/:assetId'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10, { storage })),
    __param(0, (0, common_1.Param)('assetId')),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "uploadAssetFiles", null);
__decorate([
    (0, common_1.Get)('asset/:assetId'),
    __param(0, (0, common_1.Param)('assetId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getAssetFiles", null);
__decorate([
    (0, common_1.Post)('report/:reportId'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10, { storage })),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "uploadReportFiles", null);
__decorate([
    (0, common_1.Get)('report/:reportId'),
    __param(0, (0, common_1.Param)('reportId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getReportFiles", null);
__decorate([
    (0, common_1.Post)('ticket/:ticketId'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10, { storage })),
    __param(0, (0, common_1.Param)('ticketId')),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "uploadTicketFiles", null);
__decorate([
    (0, common_1.Get)('ticket/:ticketId'),
    __param(0, (0, common_1.Param)('ticketId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getTicketFiles", null);
__decorate([
    (0, common_1.Delete)(':fileId'),
    __param(0, (0, common_1.Param)('fileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "deleteFile", null);
__decorate([
    (0, common_1.Post)('note/:noteId'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10, { storage })),
    __param(0, (0, common_1.Param)('noteId')),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "uploadNoteFiles", null);
__decorate([
    (0, common_1.Get)('note/:noteId'),
    __param(0, (0, common_1.Param)('noteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getNoteFiles", null);
__decorate([
    (0, common_1.Delete)('note-file/:fileId'),
    __param(0, (0, common_1.Param)('fileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "deleteNoteFile", null);
exports.FilesController = FilesController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('files'),
    __metadata("design:paramtypes", [files_service_1.FilesService])
], FilesController);
//# sourceMappingURL=files.controller.js.map