import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Res, Header, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { MaintenanceService } from './maintenance.service';
@ApiTags('Mantenimiento') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller('maintenance')
  export class MaintenanceController {
    constructor(private readonly service: MaintenanceService) {}

  @Get()
    findAll(@Query() q: any, @Request() req: any) {
          if (req.user?.role === 'CLIENTE') q.clientId = req.user.clientId;
          return this.service.findAll(q);
    }

  @Get('asset/:assetId')
    findByAsset(@Param('assetId') id: string, @Request() req: any) {
          const clientId = req.user?.role === 'CLIENTE' ? req.user.clientId : undefined;
          return this.service.findByAsset(id, clientId);
    }

  @Get('export') @Header('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') @Header('Content-Disposition','attachment; filename=mantenimiento.xlsx')
    async export(@Query() q: any, @Res() res: Response, @Request() req: any) {
          if (req.user?.role === 'CLIENTE') throw new ForbiddenException('No autorizado');
          res.send(await this.service.exportExcel(q));
    }

  @Post()
    create(@Body() dto: any, @Request() req: any) {
          if (req.user?.role === 'CLIENTE') throw new ForbiddenException('No autorizado');
          return this.service.create(dto);
    }

  @Put(':id')
    update(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
          if (req.user?.role === 'CLIENTE') throw new ForbiddenException('No autorizado');
          return this.service.update(id, dto);
    }

  @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
          if (req.user?.role === 'CLIENTE') throw new ForbiddenException('No autorizado');
          return this.service.remove(id);
    }
}
