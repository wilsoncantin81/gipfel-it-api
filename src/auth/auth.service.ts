import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const ALL_MODULES = ['dashboard','clientes','activos','mantenimiento','reportes','tickets','tipos','usuarios','financiero','comisiones'];
const CLIENT_MODULES = ['activos', 'tickets', 'reportes', 'mantenimiento', 'dashboard'];

@Injectable()
  export class AuthService {
    constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async validateUser(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) throw new UnauthorizedException('Credenciales inválidas');
        if (!(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException('Credenciales inválidas');
        const { passwordHash, ...result } = user;
        return result;
  }

  async login(user: any) {
        const fullUser = await this.prisma.user.findUnique({ where: { id: user.id }, select: { id: true, name: true, email: true, role: true, permissions: true, clientId: true } });
        const defaultPermissions = fullUser?.role === 'CLIENTE' ? CLIENT_MODULES : ALL_MODULES;
        const permissions = (fullUser?.permissions as string[]) || defaultPermissions;
        const payload = { sub: user.id, email: user.email, role: user.role, clientId: fullUser?.clientId || null, permissions };
        return {
                access_token: this.jwt.sign(payload),
                user: { id: user.id, name: user.name, email: user.email, role: user.role, permissions, clientId: fullUser?.clientId || null },
        };
  }

  async register(dto: any) {
        const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (exists) throw new ConflictException('Correo ya registrado');
        const role = dto.role || 'TECNICO';
        if (role === 'CLIENTE' && !dto.clientId) throw new BadRequestException('clientId es requerido para crear un usuario CLIENTE');
        if (dto.clientId) {
                const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
                if (!client) throw new BadRequestException('El cliente indicado no existe');
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const permissions = dto.permissions || (role === 'CLIENTE' ? CLIENT_MODULES : ALL_MODULES);
        const user = await this.prisma.user.create({
                data: { name: dto.name, email: dto.email, passwordHash, role, permissions, clientId: role === 'CLIENTE' ? dto.clientId : null, phone: dto.phone || undefined, whatsappApiKey: dto.whatsappApiKey || undefined },
        });
        return { id: user.id, name: user.name, email: user.email, role: user.role, clientId: user.clientId };
  }

  async updateUser(id: string, dto: any) {
        const data: any = {};
        if (dto.name !== undefined) data.name = dto.name;
        if (dto.email !== undefined) data.email = dto.email;
        if (dto.role !== undefined) data.role = dto.role;
        if (dto.clientId !== undefined) data.clientId = dto.role === 'CLIENTE' ? dto.clientId : null;
        return this.prisma.user.update({ where: { id }, data, select: { id: true, name: true, email: true, role: true, clientId: true } });
  }

  async getProfile(userId: string) {
        return this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true, isActive: true, permissions: true, clientId: true, phone: true, whatsappApiKey: true } });
  }

  async getUsers() {
        return this.prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, isActive: true, permissions: true, clientId: true, phone: true, whatsappApiKey: true }, orderBy: { name: 'asc' } });
  }

  async getTechnicians() {
        return this.prisma.user.findMany({ where: { isActive: true, role: { in: ['ADMIN', 'TECNICO'] } }, select: { id: true, name: true, email: true, role: true }, orderBy: { name: 'asc' } });
  }

  async updatePermissions(id: string, permissions: string[]) {
        return this.prisma.user.update({ where: { id }, data: { permissions: permissions as any } });
  }

  async updateContact(id: string, dto: any) {
        const data: any = {};
        if (dto.phone !== undefined) data.phone = dto.phone || null;
        if (dto.whatsappApiKey !== undefined) data.whatsappApiKey = dto.whatsappApiKey || null;
        return this.prisma.user.update({ where: { id }, data });
  }

  async resetPassword(id: string, password: string) {
        const passwordHash = await bcrypt.hash(password, 12);
        await this.prisma.user.update({ where: { id }, data: { passwordHash } });
        return { success: true };
  }

  async updateStatus(id: string, isActive: boolean) {
        return this.prisma.user.update({ where: { id }, data: { isActive } });
  }
  async getDescargasSsoUrl(user: any) {
      const profile = await this.prisma.user.findUnique({ where: { id: user.sub }, select: { name: true } });
      const payload = { sub: user.sub, name: profile?.name || user.email, role: user.role, exp: Date.now() + 60000 };
      const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const key = process.env.DESCARGAS_SSO_SECRET;
      if (!key) throw new Error('DESCARGAS_SSO_SECRET no configurado');
      const sig = crypto.createHmac('sha256', key).update(payloadB64).digest('base64url');
      const token = `${payloadB64}.${sig}`;
      const base = process.env.DESCARGAS_URL || 'https://grupogipfel.com/descargas';
      return { url: `${base}/index.php?sso=${token}` };
  }
}
