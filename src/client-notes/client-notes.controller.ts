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
    return this.prisma.clientNote.findMany({
      where: { clientId },
      orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
      include: { files: true },
    });
  }

  @Post()
  async create(@Param('clientId') clientId: string, @Body() body: any) {
    return this.prisma.clientNote.create({
      data: {
        clientId,
        category: body.category || 'General',
        title: body.title,
        content: body.content || '',
      },
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.prisma.clientNote.update({
      where: { id },
      data: {
        title: body.title,
        content: body.content || '',
        category: body.category || 'General',
      },
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.clientNote.delete({ where: { id } });
    return { deleted: true };
  }
}
