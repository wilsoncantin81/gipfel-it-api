import { Controller, Post, Delete, Param, UseGuards, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { FilesService } from './files.service';
import { PrismaService } from '../common/prisma.service';

const storage = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
  },
})const storage = memoryStorage();;

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

  @Delete(':fileId')
  async deleteFile(@Param('fileId') fileId: string) {
    await this.filesService.deleteFile(fileId);
    return { success: true };
  }
}
