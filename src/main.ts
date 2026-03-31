import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true, methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'], allowedHeaders: ['Content-Type','Authorization'], credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder().setTitle('Gipfel IT API').setVersion('1.0').addBearerAuth().build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  // Extra routes via Express adapter
  const server = app.getHttpAdapter().getInstance();

  server.get('/api/v1/dashboard/technicians', async (req: any, res: any) => {
    try {
      const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true, email: true, role: true }, orderBy: { name: 'asc' } });
      res.json(users);
    } catch(e: any) { res.status(500).json({ message: e.message }); }
  });

  server.get('/api/v1/dashboard/financials/summary', async (req: any, res: any) => {
    try {
      const where: any = { status: 'CERRADO' };
      if (req.query.from) where.resolvedAt = { gte: new Date(req.query.from) };
      if (req.query.to) where.resolvedAt = { ...where.resolvedAt, lte: new Date(req.query.to) };
      if (req.query.technicianId) where.assignedToId = req.query.technicianId;
      const tickets = await prisma.ticket.findMany({ where, include: { client: true, assignedTo: { select: { id: true, name: true } }, commission: true }, orderBy: { resolvedAt: 'desc' } });
      const totalSales = tickets.reduce((s: number, t: any) => s + (t.salePrice||0), 0);
      const totalCosts = tickets.reduce((s: number, t: any) => s + (t.totalCost||0), 0);
      const totalUtility = tickets.reduce((s: number, t: any) => s + (t.utility||0), 0);
      const totalCommissions = tickets.reduce((s: number, t: any) => s + (t.commission?.amount||0), 0);
      res.json({ tickets, totalSales, totalCosts, totalUtility, totalCommissions, count: tickets.length });
    } catch(e: any) { res.status(500).json({ message: e.message }); }
  });

  server.get('/api/v1/dashboard/financials/commissions', async (req: any, res: any) => {
    try {
      const where: any = {};
      if (req.query.userId) where.userId = req.query.userId;
      if (req.query.status) where.status = req.query.status;
      const commissions = await prisma.commission.findMany({ where, include: { user: { select: { id: true, name: true, email: true } }, ticket: { include: { client: true } } }, orderBy: { createdAt: 'desc' } });
      const totalPending = commissions.filter((c: any) => c.status === 'PENDIENTE').reduce((s: number, c: any) => s + c.amount, 0);
      const totalPaid = commissions.filter((c: any) => c.status === 'PAGADA').reduce((s: number, c: any) => s + c.amount, 0);
      res.json({ commissions, totalPending, totalPaid });
    } catch(e: any) { res.status(500).json({ message: e.message }); }
  });

  server.put('/api/v1/dashboard/financials/commissions/:id/pay', async (req: any, res: any) => {
    try {
      const c = await prisma.commission.update({ where: { id: req.params.id }, data: { status: 'PAGADA', paidAt: new Date(), notes: req.body?.notes } });
      res.json(c);
    } catch(e: any) { res.status(500).json({ message: e.message }); }
  });

  server.get('/api/v1/tickets/:id/detail', async (req: any, res: any) => {
    try {
      const t = await prisma.ticket.findUnique({ where: { id: req.params.id }, include: { client: true, asset: { include: { assetType: true } }, assignedTo: { select: { id: true, name: true, email: true } }, report: { select: { id: true, reportNumber: true, date: true } }, tasks: { orderBy: { order: 'asc' } }, expenses: { orderBy: { date: 'asc' } }, commission: { include: { user: { select: { id: true, name: true } } } } } });
      if (!t) return res.status(404).json({ message: 'Ticket no encontrado' });
      res.json(t);
    } catch(e: any) { res.status(500).json({ message: e.message }); }
  });

  server.get('/api/v1/tickets/:id/expenses/summary', async (req: any, res: any) => {
    try {
      const [expenses, ticket] = await Promise.all([prisma.ticketExpense.findMany({ where: { ticketId: req.params.id } }), prisma.ticket.findUnique({ where: { id: req.params.id } })]);
      const totalCost = expenses.reduce((s: number, e: any) => s + e.total, 0);
      const salePrice = (ticket as any)?.salePrice || 0;
      const utility = salePrice - totalCost;
      res.json({ expenses, totalCost, salePrice, utility, commission: utility * 0.10 });
    } catch(e: any) { res.status(500).json({ message: e.message }); }
  });

  server.post('/api/v1/tickets/:id/tasks', async (req: any, res: any) => {
    try {
      const count = await prisma.ticketTask.count({ where: { ticketId: req.params.id } });
      const task = await prisma.ticketTask.create({ data: { ticketId: req.params.id, title: req.body.title, order: count } });
      res.json(task);
    } catch(e: any) { res.status(500).json({ message: e.message }); }
  });

  server.put('/api/v1/tickets/tasks/:taskId/toggle', async (req: any, res: any) => {
    try {
      const task = await prisma.ticketTask.findUnique({ where: { id: req.params.taskId } });
      if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });
      const updated = await prisma.ticketTask.update({ where: { id: req.params.taskId }, data: { done: !task.done } });
      res.json(updated);
    } catch(e: any) { res.status(500).json({ message: e.message }); }
  });

  server.delete('/api/v1/tickets/tasks/:taskId', async (req: any, res: any) => {
    try {
      await prisma.ticketTask.delete({ where: { id: req.params.taskId } });
      res.json({ deleted: true });
    } catch(e: any) { res.status(500).json({ message: e.message }); }
  });

  server.post('/api/v1/tickets/:id/expenses', async (req: any, res: any) => {
    try {
      const { date, description, supplier, supplierInvoice, quantity, unitPrice } = req.body;
      const expense = await prisma.ticketExpense.create({ data: { ticketId: req.params.id, date: new Date(date), description, supplier, supplierInvoice, quantity: Number(quantity)||1, unitPrice: Number(unitPrice), total: (Number(quantity)||1) * Number(unitPrice) } });
      res.json(expense);
    } catch(e: any) { res.status(500).json({ message: e.message }); }
  });

  server.delete('/api/v1/tickets/expenses/:expenseId', async (req: any, res: any) => {
    try {
      await prisma.ticketExpense.delete({ where: { id: req.params.expenseId } });
      res.json({ deleted: true });
    } catch(e: any) { res.status(500).json({ message: e.message }); }
  });

  server.get('/api/v1/auth/technicians', async (req: any, res: any) => {
    try {
      const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true, email: true, role: true }, orderBy: { name: 'asc' } });
      res.json(users);
    } catch(e: any) { res.status(500).json({ message: e.message }); }
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Gipfel IT API corriendo en: http://localhost:${port}/api/v1`);
  console.log(`📚 Docs: http://localhost:${port}/api/docs`);
}
bootstrap();
