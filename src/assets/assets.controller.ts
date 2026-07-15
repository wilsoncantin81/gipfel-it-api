import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Res, Header } from '@nestjs/common';
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

  @Get() findAll(@Query() q: any) { return this.service.findAll(q); }

  @Get('export/excel')
  async exportExcel(@Query() q: any, @Res() res: Response) {
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
  async exportPDF(@Query() q: any, @Res() res: Response) {
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
  async getAssetPDF(@Param('id') id: string, @Res() res: Response) {
    try {
      const [html, asset] = await Promise.all([
        this.service.getAssetPDF(id),
        this.prisma.asset.findUnique({ where: { id }, select: { code: true } }),
      ]);
      const safeName = (asset?.code || id).replace(/[^a-zA-Z0-9_-]/g, '_');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="hoja_vida_${safeName}.html"`);
      res.send(html);
    } catch (error) {
      res.status(500).json({ error: 'Error generating asset PDF' });
    }
  }

  @Get(':id/qr') getQR(@Param('id') id: string) { return this.service.getQR(id); }
  @Get(':id/password') getPassword(@Param('id') id: string) { return this.service.getPassword(id); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() dto: any) { return this.service.create(dto); }
  @Put(':id') update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }

  @Post('import')
  async importExcel(@Body() body: any) { return this.service.importFromExcel(body.rows); }
}
