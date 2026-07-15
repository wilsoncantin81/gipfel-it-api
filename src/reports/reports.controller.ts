import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Res, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
@ApiTags('Reportes') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller('reports')
  export class ReportsController {
    constructor(private readonly service: ReportsService) {}

  @Get()
    findAll(@Query() q: any, @Request() req: any) {
          if (req.user?.role === 'CLIENTE') q.clientId = req.user.clientId;
          return this.service.findAll(q);
    }

  @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: any) {
          const r = await this.service.findOne(id);
          if (req.user?.role === 'CLIENTE' && (r as any)?.clientId !== req.user.clientId) {
                  throw new ForbiddenException('No autorizado');
          }
          return r;
    }

    @Post()
    create(@Body() dto: any, @Request() req: any) {
          if (req.user?.role === 'CLIENTE') throw new ForbiddenException('No autorizado');
          return this.service.create(dto);
    }
  
  @Put(':id')
    update(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
          const role = req.user?.role;
          const perms: string[] = req.user?.permissions || [];
          if (role !== 'ADMIN' && !(role === 'TECNICO' && perms.includes('tickets'))) {
                  throw new ForbiddenException('No tiene permiso para modificar reportes');
          }
          return this.service.update(id, dto, req.user?.sub);
    }

  @Get(':id/audit')
    getAuditLog(@Param('id') id: string, @Request() req: any) {
          if (req.user?.role !== 'ADMIN') throw new ForbiddenException('No autorizado');
          return this.service.getAuditLog(id);
    }

  @Post(':id/signature') saveSignature(@Param('id') id: string, @Body() body: any) { return this.service.saveSignature(id, body.signatureUrl); }
    @Get(':id/pdf') async pdf(@Param('id') id: string, @Res() res: Response) {
          try {
                  const [buffer, r] = await Promise.all([this.service.getPDF(id), this.service.findOne(id)]);
                  const safeName = (r?.reportNumber || id).replace(/[^a-zA-Z0-9_-]/g, '_');
                  res.setHeader('Content-Type', 'application/pdf');
                  res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
                  res.send(buffer);
          } catch (error) {
                  res.status(500).json({ error: 'Error generating report PDF' });
          }
    }
    @Post(':id/send') sendEmail(@Param('id') id: string, @Body() body: any) { return this.service.sendEmail(id, body?.email, body?.cc); }
}
