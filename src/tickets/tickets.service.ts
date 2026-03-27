import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { paginate } from '../common/pagination.dto';
@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}
  private async nextNumber() { const count = await this.prisma.ticket.count(); return `TK-${String(count + 1).padStart(4, '0')}`; }
  async findAll(query: any) {
    const where: any = {};
    if (query.clientId) where.clientId = query.clientId;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.search) where.OR = [{ title: { contains: query.search, mode: 'insensitive' } }];
    const { skip, take } = paginate(query.page, query.limit);
    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({ where, skip, take, include: { client: true, asset: true, assignedTo: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.ticket.count({ where }),
    ]);
    return { data, total };
  }
  async create(dto: any) {
    const ticketNumber = await this.nextNumber();
    return this.prisma.ticket.create({ data: { ticketNumber, clientId: dto.clientId, assetId: dto.assetId || undefined, assignedToId: dto.assignedToId || undefined, title: dto.title, description: dto.description, priority: dto.priority || 'MEDIA', slaHours: dto.slaHours, status: 'ABIERTO' }, include: { client: true, asset: true } });
  }
  async updateStatus(id: string, status: string) {
    const data: any = { status };
    if (status === 'CERRADO') data.resolvedAt = new Date();
    return this.prisma.ticket.update({ where: { id }, data });
  }
  async assign(id: string, assignedToId: string) { return this.prisma.ticket.update({ where: { id }, data: { assignedToId, status: 'EN_PROCESO' } }); }
  async remove(id: string) { return this.prisma.ticket.delete({ where: { id } }); }
}
