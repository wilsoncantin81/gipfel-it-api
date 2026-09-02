import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Client } from 'basic-ftp';
import { Readable } from 'stream';

@Injectable()
  export class FilesService {
    private ftp: Client;

  constructor(private prisma: PrismaService) {
        this.ftp = new Client();
  }

  private getRemotePath(filename: string) {
        const base = process.env.FTP_REMOTE_PATH || '/';
        const normalized = base.endsWith('/') ? base : `${base}/`;
        return `${normalized}${filename}`;
  }

  private getPublicUrl(filename: string) {
        const base = process.env.FTP_BASE_URL || 'https://www.grupogipfel.com/uploads';
        const normalized = base.endsWith('/') ? base.slice(0, -1) : base;
        return `${normalized}/${filename}`;
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
                          const fileStream = Readable.from(file.buffer);
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
        } catch (error) {
                throw new Error(`Error uploading files: ${error.message}`);
        } finally {
                if (!this.ftp.closed) await this.ftp.close();
        }
        return savedFiles;
  }

  async getAssetFiles(assetId: string) {
        return await this.prisma.assetFile.findMany({
                where: { assetId },
                orderBy: { uploadedAt: 'desc' },
        });
  }

  async saveReportFiles(reportId: string, files: Express.Multer.File[]) {
        const savedFiles = [];
        try {
                await this.connectFTP();
                for (const file of files) {
                          const fileStream = Readable.from(file.buffer);
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
        } catch (error) {
                throw new Error(`Error uploading files: ${error.message}`);
        } finally {
                if (!this.ftp.closed) await this.ftp.close();
        }
        return savedFiles;
  }

  async getReportFiles(reportId: string) {
        return await this.prisma.assetFile.findMany({
                where: { reportId },
                orderBy: { uploadedAt: 'desc' },
        });
  }

  async saveTicketFiles(ticketId: string, files: Express.Multer.File[]) {
        const savedFiles = [];
        try {
                await this.connectFTP();
                for (const file of files) {
                          const fileStream = Readable.from(file.buffer);
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
        } catch (error) {
                throw new Error(`Error uploading files: ${error.message}`);
        } finally {
                if (!this.ftp.closed) await this.ftp.close();
        }
        return savedFiles;
  }

  async getTicketFiles(ticketId: string) {
        return await this.prisma.assetFile.findMany({
                where: { ticketId },
                orderBy: { uploadedAt: 'desc' },
        });
  }

  async deleteFile(fileId: string) {
        const file = await this.prisma.assetFile.findUnique({ where: { id: fileId } });
        if (!file) throw new Error('File not found');
        try {
                await this.connectFTP();
                await this.ftp.remove(this.getRemotePath(file.storageName));
        } catch (error) {
                console.error('Error deleting from FTP:', error);
        } finally {
                if (!this.ftp.closed) await this.ftp.close();
        }
        await this.prisma.assetFile.delete({ where: { id: fileId } });
        return { success: true };
  }

  async saveNoteFiles(noteId: string, clientId: string, files: Express.Multer.File[]) {
    const savedFiles = [];
    try {
      await this.connectFTP();
      for (const file of files) {
        const fileStream = Readable.from(file.buffer);
        const storageName = `note-${Date.now()}-${file.originalname}`;
        await this.ftp.uploadFrom(fileStream, this.getRemotePath(storageName));
        const id = require('crypto').randomUUID();
        const url = this.getPublicUrl(storageName);
        await (this.prisma as any).$executeRaw`
          INSERT INTO client_note_files (id, note_id, client_id, filename, url, mime_type, size)
          VALUES (${id}, ${noteId}, ${clientId}, ${file.originalname}, ${url}, ${file.mimetype}, ${file.size})
        `;
        savedFiles.push({ id, noteId, filename: file.originalname, url, mimeType: file.mimetype, size: file.size });
      }
    } catch (error) {
      throw new Error(`Error uploading files: ${error.message}`);
    } finally {
      if (!this.ftp.closed) await this.ftp.close();
    }
    return savedFiles;
  }

  async getNoteFiles(noteId: string) {
    return (this.prisma as any).$queryRaw`
      SELECT * FROM client_note_files WHERE note_id = ${noteId} ORDER BY created_at DESC
    `;
  }

  async deleteNoteFile(fileId: string) {
    try {
      const files: any[] = await (this.prisma as any).$queryRaw`SELECT * FROM client_note_files WHERE id = ${fileId}`;
      if (files.length > 0) {
        const storageName = files[0].url.split('/').pop();
        try {
          await this.connectFTP();
          await this.ftp.remove(this.getRemotePath(storageName));
        } catch {}
      }
      await (this.prisma as any).$executeRaw`DELETE FROM client_note_files WHERE id = ${fileId}`;
    } catch (e) { throw new Error(e.message); }
    finally { if (!this.ftp.closed) await this.ftp.close(); }
    return { success: true };
  }

}