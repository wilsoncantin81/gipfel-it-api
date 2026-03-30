import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  async uploadFile(file: Express.Multer.File, entityType: string, entityId: string, uploadedById?: string) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const uploadDir = path.join(process.cwd(), 'uploads', entityType, entityId);
    fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(path.join(uploadDir, uniqueName), file.buffer);
    const fileUrl = `/uploads/${entityType}/${entityId}/${uniqueName}`;
    return this.prisma.attachment.create({
      data: {
        entityType: entityType.toUpperCase() as any,
        entityId,
        fileName: file.originalname,
        fileUrl,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedById: uploadedById || undefined,
      },
    });
  }

  async getFiles(entityType: string, entityId: string) {
    return this.prisma.attachment.findMany({
      where: { entityType: entityType.toUpperCase() as any, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteFile(id: string) {
    const file = await this.prisma.attachment.findUnique({ where: { id } });
    if (!file) return null;
    const localPath = path.join(process.cwd(), file.fileUrl);
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    return this.prisma.attachment.delete({ where: { id } });
  }
}
