import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard que permite el acceso si:
 *  1. El header x-cron-secret coincide con process.env.CRON_SECRET, o
 *  2. El token JWT es válido (delega a AuthGuard('jwt'))
 *
 * Usado en POST /calendar/send-daily para que Railway cron lo llame sin JWT.
 */
@Injectable()
export class CronOrJwtGuard implements CanActivate {
  private readonly jwtGuard = new (AuthGuard('jwt'))();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const cronSecret = request.headers['x-cron-secret'];
    const envSecret = process.env.CRON_SECRET;

    // Permitir si el CRON_SECRET está configurado y coincide
    if (envSecret && cronSecret === envSecret) {
      // Marcar req.user con rol ADMIN para que el handler lo acepte
      request.user = { role: 'ADMIN', sub: 'cron', email: 'cron@gipfel' };
      return true;
    }

    // Fallback: validar JWT normalmente
    return this.jwtGuard.canActivate(context) as Promise<boolean>;
  }
}
