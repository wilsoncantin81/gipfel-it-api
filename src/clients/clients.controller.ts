import { Controller, Get, Post, Put, Delete, Param, Body, Query, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Clients')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Controller('clients')
  export class ClientsController {
  constructor(private readonly service: ClientsService) {}

@Get('technicians')
  getTechnicians() { return this.service.getTechnicians(); }

@Get()
  async findAll(@Query() q: any, @Request() req: any) {
    if (req.user?.role === 'CLIENTE') {
      const c = await this.service.findOne(req.user.clientId);
      return c ? [c] : [];
    }
    return this.service.findAll(q);
  }

@Get(':id/stats')
  async getStats(@Param('id') id: string, @Request() req: any) {
    this.assertOwnClient(id, req);
    return this.service.getStats(id);
  }

@Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    this.assertOwnClient(id, req);
    return this.service.findOne(id);
  }

@Post() @Roles('ADMIN', 'TECNICO')
  create(@Body() dto: any) { return this.service.create(dto); }

@Put(':id/logo') @Roles('ADMIN', 'TECNICO')
  updateLogo(@Param('id') id: string, @Body() body: any) { return this.service.updateLogo(id, body.logoUrl); }

@Put(':id') @Roles('ADMIN', 'TECNICO')
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

@Delete(':id') @Roles('ADMIN', 'TECNICO')
  remove(@Param('id') id: string) { return this.service.remove(id); }

private assertOwnClient(id: string, req: any) {
  if (req.user?.role === 'CLIENTE' && id !== req.user.clientId) {
    throw new ForbiddenException('No autorizado');
  }
}
}
