import { Controller, Get, Put, Param, Body, Query, UseGuards, Res, Header } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { FinancialsService } from './financials.service';
@ApiTags('Financiero') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller('financials')
export class FinancialsController {
  constructor(private readonly service: FinancialsService) {}
  @Get('summary') getSummary(@Query() q: any) { return this.service.getSummary(q); }
  @Get('commissions') getCommissions(@Query() q: any) { return this.service.getCommissions(q); }
  @Get('technicians') getTechnicians() { return this.service.getTechnicians(); }
  @Put('commissions/:id/pay') payCommission(@Param('id') id: string, @Body() body: any) { return this.service.payCommission(id, body.notes); }
  @Put('commissions/pay-all/:userId') payAll(@Param('userId') userId: string) { return this.service.payAllCommissions(userId); }
  @Get('export') @Header('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') @Header('Content-Disposition','attachment; filename=financiero.xlsx')
  async export(@Query() q: any, @Res() res: Response) { res.send(await this.service.exportExcel(q)); }
}
