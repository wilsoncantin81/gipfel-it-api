import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../common/prisma.service';

@ApiTags('ClientNotes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('clients/:clientId/notes')
export class ClientNotesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll(@Param('clientId') clientId: string) {
    return (this.prisma as any).$queryRaw`
      SELECT * FROM client_notes WHERE client_id = ${clientId} ORDER BY category, created_at DESC
    `;
  }

  @Post()
  async create(@Param('clientId') clientId: string, @Body() body: any) {
    const id = require('crypto').randomUUID();
    await (this.prisma as any).$executeRaw`
      INSERT INTO client_notes (id, client_id, category, title, content)
      VALUES (${id}, ${clientId}, ${body.category || 'General'}, ${body.title}, ${body.content || ''})
    `;
    return { id, clientId, ...body };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    await (this.prisma as any).$executeRaw`
      UPDATE client_notes 
      SET title = ${body.title}, content = ${body.content || ''}, category = ${body.category || 'General'}, updated_at = now()
      WHERE id = ${id}
    `;
    return { id, ...body };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await (this.prisma as any).$executeRaw`DELETE FROM client_notes WHERE id = ${id}`;
    return { deleted: true };
  }
}
