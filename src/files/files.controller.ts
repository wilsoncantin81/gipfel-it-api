import { Controller, Post, Delete, Param, UseGuards, UseInterceptors, uploadedFiles, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
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
  @UseInterceptors(FileInterceptor('files', 10, { storage }))
  async uploadAssetFiles(@Param('assetId') assetId: string, @uploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const result = await this.filesService.saveAssetFiles(assetId, files);
    return { success: true, files: result };
  }

  @Delete('file/:fileId')
  async deleteFile(@Param('fileId') fileId: string) {
    return this.filesService.deleteAssetFile(fileId);
  }
}
