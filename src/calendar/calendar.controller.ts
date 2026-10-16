import {
  Controller, Get, Post, Put, Delete,
  Param, Body, UseGuards, Request, Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../common/prisma.service';

@ApiTags('Calendar')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('calendar')
export class CalendarController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll(@Query('month') month?: string, @Query('year') year?: string) {
    const where: any = {};
    if (month && year) {
      // Filter by month/year prefix: "2026-10"
      const prefix = `${year}-${month.padStart(2, '0')}`;
      where.date = { startsWith: prefix };
    }
    return this.prisma.calendarEvent.findMany({
      where,
      orderBy: [{ date: 'asc' }, { timeStart: 'asc' }],
    });
  }

  @Post()
  async create(@Body() body: any, @Request() req: any) {
    const userId = req.user.sub;
    const dbUser = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
    return this.prisma.calendarEvent.create({
      data: {
        date: body.date,
        type: body.type || 'otro',
        title: body.title,
        techId: body.techId || null,
        techName: body.techName || null,
        ticketId: body.ticketId || null,
        ticketNum: body.ticketNum || null,
        ticketLabel: body.ticketLabel || null,
        timeStart: body.timeStart || null,
        timeEnd: body.timeEnd || null,
        notes: body.notes || null,
        createdById: dbUser?.id || userId,
        createdByName: dbUser?.name || req.user.email,
      },
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.prisma.calendarEvent.update({
      where: { id },
      data: {
        date: body.date,
        type: body.type || 'otro',
        title: body.title,
        techId: body.techId || null,
        techName: body.techName || null,
        ticketId: body.ticketId || null,
        ticketNum: body.ticketNum || null,
        ticketLabel: body.ticketLabel || null,
        timeStart: body.timeStart || null,
        timeEnd: body.timeEnd || null,
        notes: body.notes || null,
      },
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.calendarEvent.delete({ where: { id } });
    return { deleted: true };
  }
}
