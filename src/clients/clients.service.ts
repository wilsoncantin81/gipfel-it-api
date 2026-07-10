import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { paginate } from '../common/pagination.dto';
@Injectable()
  export class ClientsService {
    constructor(private prisma: PrismaService) {}
    async findAll(query: any) {
          const where: any = {};
          if (query.search) where.OR = [{ businessName: { contains: query.search, mode: 'insensitive' } }, { city: { contains: query.search, mode: 'insensitive' } }];
          if (query.status) where.status = query.status;
          const { skip, take } = paginate(query.page, query.limit);
          const [data, total] = await Promise.all([
                  this.prisma.client.findMany({ where, skip, take, include: { _count: { select: { assets: true } } }, orderBy: { businessName: 'asc' } }),
                  this.prisma.client.count({ where }),
                ]);
          return { data, total };
    }
    async findOne(id: string) {
          const c = await this.prisma.client.findUnique({ where: { id }, include: { assets: { include: { assetType: true } }, _count: { select: { assets: true, reports: true, tickets: true } } } });
          if (!c) throw new NotFoundException('Cliente no encontrado');
          return c;
    }
    async create(dto: any) { return this.prisma.client.create({ data: dto }); }
    async update(id: string, dto: any) { await this.findOne(id); return this.prisma.client.update({ where: { id }, data: dto }); }
    async remove(id: string) { await this.findOne(id); return this.prisma.client.delete({ where: { id } }); }
    async updateLogo(id: string, logoUrl: string) { return this.prisma.client.update({ where: { id }, data: { logoUrl } }); }
    async getStats(id: string) {
          const [assets, activeAssets, mantAssets, openTickets, reports] = await Promise.all([
                  this.prisma.asset.count({ where: { clientId: id } }),
                  this.prisma.asset.count({ where: { clientId: id, status: 'ACTIVO' } }),
                  this.prisma.asset.count({ where: { clientId: id, status: 'EN_MANTENIMIENTO' } }),
                  this.prisma.ticket.count({ where: { clientId: id, status: { not: 'CERRADO' } } }),
                  this.prisma.serviceReport.count({ where: { clientId: id } }),
                ]);
          return { assets, activeAssets, mantAssets, openTickets, reports };
    }
    async getTechnicians() {
          return this.prisma.user.findMany({
                  where: { isActive: true },
                  select: { id: true, name: true, email: true, role: true },
                  orderBy: { name: 'asc' },
          });
    }
}
