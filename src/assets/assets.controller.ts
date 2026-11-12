import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Res, Header, Request, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AssetsService } from './assets.service';
import { PrismaService } from '../common/prisma.service';

@ApiTags('Assets')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Controller('assets')
  export class AssetsController {
    constructor(private readonly service: AssetsService, private readonly prisma: PrismaService) {}

  @Get()
    findAll(@Query() q: any, @Request() req: any) {
          if (req.user?.role === 'CLIENTE') q.clientId = req.user.clientId;
          return this.service.findAll(q);
    }

  @Get('export/excel')
    async exportExcel(@Query() q: any, @Res() res: Response, @Request() req: any) {
          if (req.user?.role === 'CLIENTE') q.clientId = req.user.clientId;
          try {
                  const result = await this.service.exportExcel(q);
                  const buffer = result.buffer;

            let filename = 'activos.xlsx';
                  if (result.clientName) {
                            const sanitizedName = result.clientName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                            filename = `activos_${sanitizedName}.xlsx`;
                  }

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                  res.setHeader('Content-Length', buffer.length);
                  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                  res.setHeader('Pragma', 'no-cache');
                  res.setHeader('Expires', '0');

            res.send(buffer);
          } catch (error) {
                  res.status(500).json({ error: 'Error generating Excel export' });
          }
    }

  @Get('export/pdf')
    async exportPDF(@Query() q: any, @Res() res: Response, @Request() req: any) {
          if (req.user?.role === 'CLIENTE') q.clientId = req.user.clientId;
          try {
                  const html = await this.service.exportPDF(q);
                  res.setHeader('Content-Type', 'text/html; charset=utf-8');
                  res.setHeader('Content-Disposition', 'attachment; filename="reporte_activos.html"');
                  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                  res.send(html);
          } catch (error) {
                  res.status(500).json({ error: 'Error generating PDF export' });
          }
    }

  @Get(':id/pdf')
    async getAssetPDF(@Param('id') id: string, @Res() res: Response, @Request() req: any) {
          try {
                  const asset = await this.prisma.asset.findUnique({ where: { id }, select: { code: true, clientId: true } });
                  if (!asset) { res.status(404).json({ error: 'Asset not found' }); return; }
                  if (req.user?.role === 'CLIENTE' && asset?.clientId !== req.user.clientId) throw new ForbiddenException('No autorizado');
                  const pdfBuf = await this.service.getAssetPDF(id);
                  const safeName = (asset?.code || id).replace(/[^a-zA-Z0-9_-]/g, '_');
                  res.setHeader('Content-Type', 'application/pdf');
                  res.setHeader('Content-Disposition', `inline; filename="hoja_vida_${safeName}.pdf"`);
                  res.send(pdfBuf);
          } catch (error) {
                  if (error instanceof ForbiddenException) throw error;
                  res.status(500).json({ error: 'Error generating asset PDF' });
          }
    }

  @Get(':id/qr')
    async getQR(@Param('id') id: string, @Request() req: any) {
          if (req.user?.role === 'CLIENTE') {
                  const asset = await this.prisma.asset.findUnique({ where: { id }, select: { clientId: true } });
                  if (asset?.clientId !== req.user.clientId) throw new ForbiddenException('No autorizado');
          }
          return this.service.getQR(id);
    }

  @Get(':id/password')
    async getPassword(@Param('id') id: string, @Request() req: any) {
          if (req.user?.role === 'CLIENTE') throw new ForbiddenException('No autorizado');
          return this.service.getPassword(id);
    }

  @Get(':id/remote-password')
    async getRemotePassword(@Param('id') id: string, @Request() req: any) {
          if (req.user?.role === 'CLIENTE') throw new ForbiddenException('No autorizado');
          return this.service.getRemotePassword(id);
    }

  @Get(':id/client-changes')
    clientChanges(@Param('id') id: string, @Request() req: any) {
          if (req.user?.role === 'CLIENTE') throw new ForbiddenException('No autorizado');
          return this.service.clientChanges(id);
    }

  @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: any) {
          const asset = await this.service.findOne(id);
          if (req.user?.role === 'CLIENTE' && asset?.clientId !== req.user.clientId) throw new ForbiddenException('No autorizado');
          return asset;
    }

  @Post()
    async create(@Body() dto: any, @Request() req: any) {
          if (req.user?.role === 'CLIENTE') throw new ForbiddenException('No autorizado');
          try { return await this.service.create(dto); }
          catch (e: any) {
            if (e?.code === 'P2002') {
              const field = e?.meta?.target?.[0] || 'campo';
              const msg = field === 'serial' ? 'Ya existe un activo con ese número de serie' : field === 'code' ? 'Ya existe un activo con ese código' : `Valor duplicado en: ${field}`;
              throw new BadRequestException(msg);
            }
            throw e;
          }
    }

  @Put(':id')
    async update(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
          // Clientes: edición limitada (ubicación, asignado, responsable, observaciones, estado) y con registro
          if (req.user?.role === 'CLIENTE') return this.service.updateByClient(id, dto, { id: req.user.sub, clientId: req.user.clientId });
          try { return await this.service.update(id, dto); }
          catch (e: any) {
            if (e?.code === 'P2002') {
              const field = e?.meta?.target?.[0] || 'campo';
              const msg = field === 'serial' ? 'Ya existe un activo con ese número de serie' : field === 'code' ? 'Ya existe un activo con ese código' : `Valor duplicado en: ${field}`;
              throw new BadRequestException(msg);
            }
            throw e;
          }
    }

  @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
          if (req.user?.role === 'CLIENTE') throw new ForbiddenException('No autorizado');
          return this.service.remove(id);
    }

  @Post('import')
    async importExcel(@Body() body: any, @Request() req: any) {
          if (req.user?.role === 'CLIENTE') throw new ForbiddenException('No autorizado');
          return this.service.importFromExcel(body.rows);
    }
}
