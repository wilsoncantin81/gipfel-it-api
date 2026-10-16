import {
  Controller, Get, Post, Put, Delete,
  Param, Body, UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../common/prisma.service';

@ApiTags('TeamNotes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('team-notes')
export class TeamNotesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll() {
    return this.prisma.teamNote.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  async create(@Body() body: any, @Request() req: any) {
    const user = req.user;
    return this.prisma.teamNote.create({
      data: {
        title: body.title,
        body: body.body || '',
        category: body.category || 'general',
        authorId: user.id,
        authorName: user.name,
      },
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.prisma.teamNote.update({
      where: { id },
      data: {
        title: body.title,
        body: body.body || '',
        category: body.category || 'general',
        convertedToTicket: body.convertedToTicket ?? undefined,
      },
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.teamNote.delete({ where: { id } });
    return { deleted: true };
  }
}
