import { Controller, Post, Delete, Get, Param, UseGuards, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FilesService } from './files.service';

const storage = memoryStorage();

@UseGuards(AuthGuard('jwt'))
  @Controller('files')
  export class FilesController {
    constructor(private readonly filesService: FilesService) {}

  @Post('asset/:assetId')
    @UseInterceptors(FilesInterceptor('files', 10, { storage }))
    async uploadAssetFiles(
          @Param('assetId') assetId: string,
          @UploadedFiles() files: Express.Multer.File[]
        ) {
          if (!files || files.length === 0) {
                  throw new BadRequestException('No files provided');
          }
          const savedFiles = await this.filesService.saveAssetFiles(assetId, files);
          return { success: true, files: savedFiles };
    }

  @Get('asset/:assetId')
    async getAssetFiles(@Param('assetId') assetId: string) {
          return await this.filesService.getAssetFiles(assetId);
    }

  @Post('report/:reportId')
    @UseInterceptors(FilesInterceptor('files', 10, { storage }))
    async uploadReportFiles(
          @Param('reportId') reportId: string,
          @UploadedFiles() files: Express.Multer.File[]
        ) {
          if (!files || files.length === 0) {
                  throw new BadRequestException('No files provided');
          }
          const savedFiles = await this.filesService.saveReportFiles(reportId, files);
          return { success: true, files: savedFiles };
    }

  @Get('report/:reportId')
    async getReportFiles(@Param('reportId') reportId: string) {
          return await this.filesService.getReportFiles(reportId);
    }

  @Delete(':fileId')
    async deleteFile(@Param('fileId') fileId: string) {
          return await this.filesService.deleteFile(fileId);
    }
}
