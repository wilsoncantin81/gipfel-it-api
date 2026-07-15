import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Client } from 'basic-ftp';
import * as path from 'path';
import * as fs from 'fs';
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
        await this.ftp.uploadFrom(fileStream, `/${uniqueName}`);        const dbFile = await this.prisma.assetFile.create({
          data: {
            assetId,
            filename: file.originalname,
            storageName: uniqueName,
            mimetype: file.mimetype,
            size: file.size,
            fileUrl: `https://www.grupogipfel.com/${uniqueName}`,
            uploadedAt: new Date(),
          },
        });
        savedFiles.push(dbFile);
      }
    } catch (error) {
      throw new Error('Error uploading files: ' + error.message);
    } finally {
      if (!this.ftp.closed) await this.ftp.close();
    }
    return savedFiles;
  }

  async deleteFile(fileId: string) {
    try {
      const file = await this.prisma.assetFile.findUnique({ where: { id: fileId } });
      if (!file) throw new Error('File not found');
      await this.connectFTP();
      await this.ftp.remove(`/${file.storageName}`);
      await this.prisma.assetFile.delete({ where: { id: fileId } });
      return { success: true };
    } catch (error) {
      throw new Error('Error deleting file: ' + error.message);
    } finally {
      if (!this.ftp.closed) await this.ftp.close();
    }
  }

  async getAssetFiles(assetId: string) {
    return this.prisma.assetFile.findMany({ where: { assetId } });
  }
}
