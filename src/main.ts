import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

const prisma = new PrismaClient();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
['https://grupogipfel.com', 'http://localhost:3000', 'http://localhost:4200']    methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'],
    allowedHeaders: ['Content-Type','Authorization'],
    credentials: true,
  });

  // Middleware - path does NOT include /api/v1 prefix in NestJS
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const p = req.path;
    const m = req.method;
    console.log('MIDDLEWARE HIT:', m, p);

    if (m === 'GET' && (p === '/dashboard/technicians' || p === '/auth/technicians' || p === '/api/v1/dashboard/technicians' || p === '/api/v1/auth/technicians')) {
      try {
        const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true, email: true, role: true }, orderBy: { name: 'asc' } });
        return res.json(users);
      } catch(e: any) { return res.status(500).json({ message: e.message }); }
    }

    if (m === 'GET' && p === '/dashboard/financials/summary') {
      try {
        const where: any = { status: 'CERRADO' };
                if (req.query.from) where.resolvedAt = { gte: new Date(String(req.query.from)) };
                if (req.query.to) where.resolvedAt = { ...where.resolvedAt, lte: new Date(String(req.query.to)) };
        if (req.query.technicianId) where.assignedToId = req.query.technicianId;
        const tickets = await prisma.ticket.findMany({ where, include: { client: true, assignedTo: { select: { id: true, name: true } }, commission: true }, orderBy: { resolvedAt: 'desc' } });
        return res.json({ tickets, totalSales: tickets.reduce((s,t:any)=>s+(t.salePrice||0),0), totalCosts: tickets.reduce((s,t:any)=>s+(t.totalCost||0),0), totalUtility: tickets.reduce((s,t:any)=>s+(t.utility||0),0), totalCommissions: tickets.reduce((s,t:any)=>s+((t.commission as any)?.amount||0),0), count: tickets.length });
      } catch(e: any) { return res.status(500).json({ message: e.message }); }
    }

    if (m === 'GET' && p === '/dashboard/financials/commissions') {
      try {
        const where: any = {};
        if (req.query.userId) where.userId = req.query.userId;
        if (req.query.status) where.status = req.query.status;
        const commissions = await prisma.commission.findMany({ where, include: { user: { select: { id: true, name: true, email: true } }, ticket: { include: { client: true } } }, orderBy: { createdAt: 'desc' } });
        return res.json({ commissions, totalPending: commissions.filter((c:any)=>c.status==='PENDIENTE').reduce((s,c:any)=>s+c.amount,0), totalPaid: commissions.filter((c:any)=>c.status==='PAGADA').reduce((s,c:any)=>s+c.amount,0) });
      } catch(e: any) { return res.status(500).json({ message: e.message }); }
    }

    if (m === 'PUT' && p.match(/^\/dashboard\/financials\/commissions\/[^/]+\/pay$/)) {
      try {
        const id = p.split('/')[4];
        return res.json(await prisma.commission.update({ where: { id }, data: { status: 'PAGADA', paidAt: new Date(), notes: (req.body as any)?.notes } }));
      } catch(e: any) { return res.status(500).json({ message: e.message }); }
    }

    if (m === 'GET' && p.match(/^\/tickets\/[^/]+\/detail$/)) {
      try {
        const id = p.split('/')[2];
        const t = await prisma.ticket.findUnique({ where: { id }, include: { client: true, asset: { include: { assetType: true } }, assignedTo: { select: { id: true, name: true, email: true } }, report: { select: { id: true, reportNumber: true, date: true } }, tasks: { orderBy: { order: 'asc' } }, expenses: { orderBy: { date: 'asc' } }, commission: { include: { user: { select: { id: true, name: true } } } } } });
        if (!t) return res.status(404).json({ message: 'Ticket no encontrado' });
        return res.json(t);
      } catch(e: any) { return res.status(500).json({ message: e.message }); }
    }

    if (m === 'GET' && p.match(/^\/tickets\/[^/]+\/expenses\/summary$/)) {
      try {
        const id = p.split('/')[2];
        const [expenses, ticket] = await Promise.all([prisma.ticketExpense.findMany({ where: { ticketId: id } }), prisma.ticket.findUnique({ where: { id } })]);
        const totalCost = expenses.reduce((s,e:any)=>s+e.total,0);
        const salePrice = (ticket as any)?.salePrice||0;
        const utility = salePrice - totalCost;
        return res.json({ expenses, totalCost, salePrice, utility, commission: utility*0.10 });
      } catch(e: any) { return res.status(500).json({ message: e.message }); }
    }

    if (m === 'POST' && p.match(/^\/tickets\/[^/]+\/tasks$/)) {
      try {
        const id = p.split('/')[2];
        const count = await prisma.ticketTask.count({ where: { ticketId: id } });
        return res.json(await prisma.ticketTask.create({ data: { ticketId: id, title: (req.body as any).title, order: count } }));
      } catch(e: any) { return res.status(500).json({ message: e.message }); }
    }

    if (m === 'PUT' && p.match(/^\/tickets\/tasks\/[^/]+\/toggle$/)) {
      try {
        const id = p.split('/')[3];
        const task = await prisma.ticketTask.findUnique({ where: { id } });
        if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });
        return res.json(await prisma.ticketTask.update({ where: { id }, data: { done: !task.done } }));
      } catch(e: any) { return res.status(500).json({ message: e.message }); }
    }

    if (m === 'DELETE' && p.match(/^\/tickets\/tasks\/[^/]+$/)) {
      try {
        await prisma.ticketTask.delete({ where: { id: p.split('/')[3] } });
        return res.json({ deleted: true });
      } catch(e: any) { return res.status(500).json({ message: e.message }); }
    }

    if (m === 'POST' && p.match(/^\/tickets\/[^/]+\/expenses$/)) {
      try {
        const id = p.split('/')[2];
        const { date, description, supplier, supplierInvoice, quantity, unitPrice } = req.body as any;
        const qty = Number(quantity)||1; const price = Number(unitPrice);
        return res.json(await prisma.ticketExpense.create({ data: { ticketId: id, date: new Date(date), description, supplier, supplierInvoice, quantity: qty, unitPrice: price, total: qty*price } }));
      } catch(e: any) { return res.status(500).json({ message: e.message }); }
    }

    if (m === 'DELETE' && p.match(/^\/tickets\/expenses\/[^/]+$/)) {
      try {
        await prisma.ticketExpense.delete({ where: { id: p.split('/')[3] } });
        return res.json({ deleted: true });
      } catch(e: any) { return res.status(500).json({ message: e.message }); }
    }

    next();
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder().setTitle('Gipfel IT API').setVersion('1.0').addBearerAuth().build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Gipfel IT API corriendo en: http://localhost:${port}/api/v1`);
}
bootstrap();
