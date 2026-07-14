import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Res, Header, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AssetsService } from './assets.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Assets')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Controller('assets')
  export class AssetsController {
  constructor(private readonly service: AssetsService) {}

@Get()
  findAll(@Query() q: any, @Request() req: any) {
    if (req.user?.role === 'CLIENTE') q.clientId = req.user.clientId;
    return this.service.findAll(q);
  }

    @Get('export/pdf')
    @Header('Content-Type', 'application/pdf')
    @Header('Content-Disposition', 'attachment; filename=activos.pdf')
    async exportPdfByClient(@Query() q: any, @Res() res: Response) { res.send(await this.service.exportPDF(q)); }

  
@Get('export')
  @Roles('ADMIN', 'TECNICO')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename=activos.xlsx')
  async exportExcel(@Query() q: any, @Res() res: Response) { res.send(await this.service.exportExcel(q)); }

@Get('export-pdf')
  @Roles('ADMIN', 'TECNICO')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename=activos.pdf')
  async exportPDF(@Query() q: any, @Res() res: Response) { res.send(await this.service.exportPDF(q)); }

@Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename=hoja-vida.pdf')
  async getAssetPDF(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
    await this.assertOwnAsset(id, req);
    res.send(await this.service.getAssetPDF(id));
  }

@Get(':id/qr')
  async getQR(@Param('id') id: string, @Request() req: any) {
    await this.assertOwnAsset(id, req);
    return this.service.getQR(id);
  }

@Get(':id/password')
  @Roles('ADMIN', 'TECNICO')
  getPassword(@Param('id') id: string) { return this.service.getPassword(id); }

@Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.assertOwnAsset(id, req);
  }

@Post() @Roles('ADMIN', 'TECNICO') create(@Body() dto: any) { return this.service.create(dto); }
  @Post('import') @Roles('ADMIN', 'TECNICO') async importExcel(@Body() body: any) { return this.service.importFromExcel(body.rows); }
  @Put(':id') @Roles('ADMIN', 'TECNICO') update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }
  @Delete(':id') @Roles('ADMIN', 'TECNICO') remove(@Param('id') id: string) { return this.service.remove(id); }

private async assertOwnAsset(id: string, req: any) {
  const asset = await this.service.findOne(id);
  if (req.user?.role === 'CLIENTE' && asset?.clientId !== req.user.clientId) {
    throw new ForbiddenException('No autorizado');
  }
  return asset;
}
}
