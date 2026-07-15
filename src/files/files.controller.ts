import { Controller, Post, Delete, Param, UseGuards, UseInterceptors, UploadedFiles, BadRequestException, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { FilesService } from './files.service';
import { PrismaService } from '../common/prisma.service';

const storage = memoryStorage();

@UseGuards(AuthGuard('jwt'))
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService, private readonly prisma: PrismaService) {}

  @Post('asset/:assetId')
  @UseInterceptors(FilesInterceptor('files', 10, { storage }))
  async uploadAssetFiles(@Param('assetId') assetId: string, @UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    const result = await this.filesService.saveAssetFiles(assetId, files);
    return { success: true, files: result };
  }

  @Get('asset/:assetId')
  async getAssetFiles(@Param('assetId') assetId: string) {
    return this.filesService.getAssetFiles(assetId);
  }

  @Get('download/:fileId')
  async downloadFile(@Param('fileId') fileId: string, @Res() res: Response) {
    try {
      const file = await this.filesService.downloadFile(fileId);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.setHeader('Content-Type', file.mimetype);
      res.send(file.buffer);
    } catch (error) {
      res.status(404).json({ error: 'File not found' });
    }
  }

  @Delete(':fileId')
  async deleteFile(@Param('fileId') fileId: string) {
    return this.filesService.deleteFile(fileId);
  }
}
