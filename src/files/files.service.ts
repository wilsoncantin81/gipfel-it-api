import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Client } from 'basic-ftp';
import * as path from 'path';
import { Readable } from 'stream';

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
        const fileStream = Readable.from(file.buffer);
        await this.ftp.uploadFrom(fileStream, `/public_html/uploads/${uniqueName}`);

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
      if (!this.ftp.closed) await this.ftp.close();
    }
    return savedFiles;
  }

  async downloadFile(fileId: string) {
    try {
      const file = await this.prisma.assetFile.findUnique({ where: { id: fileId } });
      if (!file) throw new Error('File not found');

      await this.connectFTP();
      const buffer = await this.ftp.downloadTo(Buffer.alloc(0), `/${file.storageName}`);

      return {
        filename: file.filename,
        mimetype: file.mimetype,
        buffer: buffer,
      };
    } catch (error) {
      throw new Error(`Error downloading file: ${error.message}`);
    } finally {
      if (!this.ftp.closed) await this.ftp.close();
    }
  }

  async deleteFile(fileId: string) {
    const file = await this.prisma.assetFile.findUnique({ where: { id: fileId } });
    if (file) {
      try {
        await this.connectFTP();
        await this.ftp.remove(`/public_html/uploads/${file.storageName}`);
      } catch (error) {
        console.error('Error deleting file from FTP:', error);
      } finally {
        if (!this.ftp.closed) await this.ftp.close();
      }
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
