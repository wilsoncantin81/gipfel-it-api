import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
@ApiTags('Tickets') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller('tickets')
export class TicketsController {
  constructor(private readonly service: TicketsService) {}
  @Get() findAll(@Query() q: any) { return this.service.findAll(q); }
  @Post() create(@Body() dto: any) { return this.service.create(dto); }
  @Put(':id/status') updateStatus(@Param('id') id: string, @Body() body: any) { return this.service.updateStatus(id, body.status); }
  @Put(':id/assign') assign(@Param('id') id: string, @Body() body: any) { return this.service.assign(id, body.technicianId); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
