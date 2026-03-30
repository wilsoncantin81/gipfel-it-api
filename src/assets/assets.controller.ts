import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Res, Header } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AssetsService } from './assets.service';
@ApiTags('Activos') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller('assets')
export class AssetsController {
  constructor(private readonly service: AssetsService) {}
  @Get() findAll(@Query() q: any) { return this.service.findAll(q); }
  @Get('search') searchByCode(@Query('q') q: string, @Query('clientId') clientId: string) { return this.service.searchByCode(q, clientId); }
  @Get('export') @Header('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') @Header('Content-Disposition','attachment; filename=activos.xlsx')
  async export(@Query() q: any, @Res() res: Response) { res.send(await this.service.exportExcel(q)); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Get(':id/qr') getQR(@Param('id') id: string) { return this.service.getQR(id); }
  @Get(':id/password') revealPassword(@Param('id') id: string) { return this.service.revealPassword(id); }
  @Post() create(@Body() dto: any) { return this.service.create(dto); }
  @Put(':id') update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
