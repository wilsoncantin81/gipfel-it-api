import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Tickets')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Controller('tickets')
    export class TicketsController {
    constructor(private readonly service: TicketsService) {}

@Get()
    findAll(@Query() q: any, @Request() req: any) {
          if (req.user?.role === 'CLIENTE') q.clientId = req.user.clientId;
          return this.service.findAll(q);
    }

@Get('tasks/:taskId')
    @Roles('ADMIN', 'TECNICO')
    getTask(@Param('taskId') id: string) { return this.service.getTask(id); }

@Get(':id/expenses/summary')
    @Roles('ADMIN', 'TECNICO')
    getSummary(@Param('id') id: string) { return this.service.getExpenseSummary(id); }

@Get(':id')
    async findOne(@Param('id') id: string, @Request() req: any) {
          if (req.user?.role === 'CLIENTE') {
                  throw new ForbiddenException('No autorizado para ver el detalle del ticket');
          }
          return this.service.findOne(id);
    }

@Post()
    create(@Body() dto: any, @Request() req: any) {
          const payload: any = { ...dto, userId: req.user?.sub };
          if (req.user?.role === 'CLIENTE') {
                  payload.clientId = req.user.clientId;
                  payload.assignedToId = undefined;
          }
          return this.service.create(payload);
    }

@Post(':id/tasks') @Roles('ADMIN', 'TECNICO') addTask(@Param('id') id: string, @Body() body: any) { return this.service.addTask(id, body.title); }
    @Post(':id/expenses') @Roles('ADMIN', 'TECNICO') addExpense(@Param('id') id: string, @Body() dto: any) { return this.service.addExpense(id, dto); }
    @Put('tasks/:taskId/toggle') @Roles('ADMIN', 'TECNICO') toggleTask(@Param('taskId') id: string) { return this.service.toggleTask(id); }
    @Put(':id/status') @Roles('ADMIN', 'TECNICO') updateStatus(@Param('id') id: string, @Body() body: any, @Request() req: any) { return this.service.updateStatus(id, body, req.user?.sub); }
    @Put(':id') @Roles('ADMIN', 'TECNICO') update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }
    @Delete('tasks/:taskId') @Roles('ADMIN', 'TECNICO') deleteTask(@Param('taskId') id: string) { return this.service.deleteTask(id); }
    @Delete('expenses/:expenseId') @Roles('ADMIN', 'TECNICO') deleteExpense(@Param('expenseId') id: string) { return this.service.deleteExpense(id); }
    @Delete(':id') @Roles('ADMIN', 'TECNICO') remove(@Param('id') id: string) { return this.service.remove(id); }
}
