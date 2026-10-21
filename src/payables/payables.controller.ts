import {
  Controller, Get, Post, Put, Delete,
  Param, Body, UseGuards, Request, Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../common/prisma.service';

@ApiTags('Payables')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('payables')
export class PayablesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    // Auto-update overdue: mark pendiente invoices with past due_date as vencida
    const today = new Date().toISOString().split('T')[0];
    await this.prisma.payableInvoice.updateMany({
      where: { status: 'pendiente', dueDate: { lt: today } },
      data: { status: 'vencida' },
    });
    return this.prisma.payableInvoice.findMany({
      where,
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });
  }

  @Get('summary')
  async summary() {
    const today = new Date().toISOString().split('T')[0];
    const in7 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    // Auto-mark overdue first
    await this.prisma.payableInvoice.updateMany({
      where: { status: 'pendiente', dueDate: { lt: today } },
      data: { status: 'vencida' },
    });

    const [all, overdue, dueSoon7, totalPending] = await Promise.all([
      this.prisma.payableInvoice.count({ where: { status: { in: ['pendiente', 'vencida'] } } }),
      this.prisma.payableInvoice.count({ where: { status: 'vencida' } }),
      this.prisma.payableInvoice.count({
        where: { status: 'pendiente', dueDate: { gte: today, lte: in7 } },
      }),
      this.prisma.payableInvoice.aggregate({
        where: { status: { in: ['pendiente', 'vencida'] } },
        _sum: { amount: true },
      }),
    ]);

    return {
      total: all,
      overdue,
      dueSoon7,
      totalAmount: totalPending._sum.amount || 0,
    };
  }

  @Get('alerts')
  async alerts() {
    const today = new Date().toISOString().split('T')[0];
    const in7 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    await this.prisma.payableInvoice.updateMany({
      where: { status: 'pendiente', dueDate: { lt: today } },
      data: { status: 'vencida' },
    });
    return this.prisma.payableInvoice.findMany({
      where: {
        status: { in: ['pendiente', 'vencida'] },
        dueDate: { lte: in7 },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  @Post()
  async create(@Body() body: any, @Request() req: any) {
    const userId = req.user.sub;
    const dbUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });
    // Auto due date: invoice_date + 30 days if not provided
    let dueDate = body.dueDate;
    if (!dueDate && body.invoiceDate) {
      const d = new Date(body.invoiceDate);
      d.setDate(d.getDate() + 30);
      dueDate = d.toISOString().split('T')[0];
    }
    return this.prisma.payableInvoice.create({
      data: {
        invoiceNumber: body.invoiceNumber || null,
        type: body.type || 'factura',
        supplier: body.supplier,
        description: body.description || null,
        amount: parseFloat(body.amount),
        invoiceDate: body.invoiceDate,
        dueDate,
        status: 'pendiente',
        notes: body.notes || null,
        createdById: dbUser?.id || userId,
        createdByName: dbUser?.name || req.user.email,
      },
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const data: any = {};
    if (body.invoiceNumber !== undefined) data.invoiceNumber = body.invoiceNumber;
    if (body.type !== undefined) data.type = body.type;
    if (body.supplier !== undefined) data.supplier = body.supplier;
    if (body.description !== undefined) data.description = body.description;
    if (body.amount !== undefined) data.amount = parseFloat(body.amount);
    if (body.invoiceDate !== undefined) data.invoiceDate = body.invoiceDate;
    if (body.dueDate !== undefined) data.dueDate = body.dueDate;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.status !== undefined) data.status = body.status;
    if (body.paidAt !== undefined) data.paidAt = body.paidAt;
    if (body.paidAmount !== undefined) data.paidAmount = parseFloat(body.paidAmount);
    return this.prisma.payableInvoice.update({ where: { id }, data });
  }

  @Put(':id/pay')
  async markPaid(@Param('id') id: string, @Body() body: any) {
    const today = new Date().toISOString().split('T')[0];
    return this.prisma.payableInvoice.update({
      where: { id },
      data: {
        status: 'pagada',
        paidAt: body.paidAt || today,
        paidAmount: body.paidAmount ? parseFloat(body.paidAmount) : undefined,
      },
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.payableInvoice.delete({ where: { id } });
    return { deleted: true };
  }
}
