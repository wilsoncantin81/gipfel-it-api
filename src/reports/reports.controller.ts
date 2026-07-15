import { Controller, Get, Post, Param, Body, Query, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
@ApiTags('Reportes') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}
  @Get() findAll(@Query() q: any) { return this.service.findAll(q); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() dto: any) { return this.service.create(dto); }
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
  @Post(':id/send') sendEmail(@Param('id') id: string) { return this.service.sendEmail(id); }
}
