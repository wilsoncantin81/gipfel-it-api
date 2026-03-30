import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
@ApiTags('Tickets') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller('tickets')
export class TicketsController {
  constructor(private readonly service: TicketsService) {}
  @Get() findAll(@Query() q: any) { return this.service.findAll(q); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Get(':id/expenses/summary') getSummary(@Param('id') id: string) { return this.service.getExpenseSummary(id); }
  @Post() create(@Body() dto: any) { return this.service.create(dto); }
  @Put(':id') update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }
  @Put(':id/status') updateStatus(@Param('id') id: string, @Body() body: any) { return this.service.updateStatus(id, body.status, body); }
  @Post(':id/tasks') addTask(@Param('id') id: string, @Body() body: any) { return this.service.addTask(id, body.title); }
  @Put('tasks/:taskId/toggle') toggleTask(@Param('taskId') id: string) { return this.service.toggleTask(id); }
  @Delete('tasks/:taskId') deleteTask(@Param('taskId') id: string) { return this.service.deleteTask(id); }
  @Post(':id/expenses') addExpense(@Param('id') id: string, @Body() dto: any) { return this.service.addExpense(id, dto); }
  @Delete('expenses/:expenseId') deleteExpense(@Param('expenseId') id: string) { return this.service.deleteExpense(id); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
