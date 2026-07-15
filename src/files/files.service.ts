import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Client } from 'basic-ftp';
import * as path from 'path';

@Injectable()
export class FilesService {
  private ftp: Client;

  constructor(private prisma: PrismaService) {
    this.ftp = new Client();
  }

  private async connectFTP() {
    if (!this.ftp.closed) return;
    await this.ftp.access({
      host: process.env.FTP_HOST || 'ftp.grupogipfel.com',
      user: process.env.FTP_USER || 'uploads@grupogipfel.com',
      password: process.env.FTP_PASS || '',
      port: 21,
    });
  }

  async saveAssetFiles(assetId: string, files: Express.Multer.File[]) {
    const savedFiles = [];

    try {
      await this.connectFTP();

      for (const file of files) {
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;

        // Subir a SiteGround
        await this.ftp.uploadFrom(file.buffer, `/public_html/uploads/${uniqueName}`);

        // Crear registro en BD
        const dbFile = await this.prisma.assetFile.create({
          data: {
            assetId,
            filename: file.originalname,
            storageName: uniqueName,
            mimetype: file.mimetype,
            size: file.size,
            fileUrl: `https://www.grupogipfel.com/uploads/${uniqueName}`,
            uploadedAt: new Date(),
          },
        });

        savedFiles.push({
          id: dbFile.id,
          filename: dbFile.filename,
          size: dbFile.size,
          fileUrl: dbFile.fileUrl,
          uploadedAt: dbFile.uploadedAt,
        });
      }
    } catch (error) {
      throw new Error(`Error uploading files: ${error.message}`);
    } finally {
      await this.ftp.close();
    }

    return savedFiles;
  }

  async deleteFile(fileId: string) {
    const file = await this.prisma.assetFile.findUnique({ where: { id: fileId } });

    if (file) {
      try {
        await this.connectFTP();
        // Eliminar del FTP
        await this.ftp.remove(`/public_html/uploads/${file.storageName}`);
      } catch (error) {
        console.error('Error deleting file from FTP:', error);
      } finally {
        await this.ftp.close();
      }

      // Eliminar registro de BD
      await this.prisma.assetFile.delete({ where: { id: fileId } });
    }
  }

  async getAssetFiles(assetId: string) {
    return this.prisma.assetFile.findMany({
      where: { assetId },
      orderBy: { uploadedAt: 'desc' },
    });
  }
}
