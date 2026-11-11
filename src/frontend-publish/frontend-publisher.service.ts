import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Client } from 'basic-ftp';
import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Readable, Writable } from 'stream';

/**
 * Publica public/index.html en el hosting de grupogipfel.com por FTP al arrancar la API.
 *
 * Variables:
 *   FRONTEND_FTP_PATH  → ruta remota del archivo, ej: /public_html/gipfel.html
 *                        Si no está, solo se registra en los logs qué carpetas ve el FTP (diagnóstico).
 *   FRONTEND_FTP_USER / FRONTEND_FTP_PASS → opcionales; si no están se usan FTP_USER / FTP_PASS.
 *
 * Antes de reemplazar, guarda una copia del archivo actual como gipfel_backup_YYYYMMDD-HHMM.html
 * en la misma carpeta. Si el contenido no cambió, no sube nada.
 */
@Injectable()
export class FrontendPublisherService implements OnApplicationBootstrap {
  onApplicationBootstrap() {
    // No bloquear el arranque de la API
    setTimeout(() => this.publish().catch(e => console.error('🌐 [frontend] error:', e?.message)), 5000);
  }

  private async publish() {
    const local = join(process.cwd(), 'public', 'index.html');
    if (!existsSync(local)) {
      console.log('🌐 [frontend] public/index.html no existe en el contenedor, nada que publicar');
      return;
    }
    const content = readFileSync(local);
    const localHash = createHash('sha256').update(content).digest('hex');

    const client = new Client(30000);
    try {
      await client.access({
        host: process.env.FTP_HOST || 'ftp.grupogipfel.com',
        user: process.env.FRONTEND_FTP_USER || process.env.FTP_USER || '',
        password: process.env.FRONTEND_FTP_PASS || process.env.FTP_PASS || '',
        port: 21,
      });

      const target = process.env.FRONTEND_FTP_PATH;
      if (!target) {
        const pwd = await client.pwd();
        const root = await client.list('/');
        console.log(`🌐 [frontend] diagnóstico FTP — pwd: ${pwd} — raíz: ${root.map(f => (f.isDirectory ? f.name + '/' : f.name)).join(', ')}`);
        for (const dir of ['/public_html', '/www', '/htdocs']) {
          try {
            const l = await client.list(dir);
            const has = l.some(f => f.name === 'gipfel.html');
            console.log(`🌐 [frontend] ${dir}: ${l.length} elementos${has ? ' — contiene gipfel.html' : ''}`);
          } catch {
            /* no accesible */
          }
        }
        console.log('🌐 [frontend] FRONTEND_FTP_PATH no configurado: no se publicó nada');
        return;
      }

      // ¿Cambió? Descargar el actual y comparar
      let remote: Buffer | null = null;
      try {
        const chunks: Buffer[] = [];
        const sink = new Writable({ write(c, _e, cb) { chunks.push(Buffer.from(c)); cb(); } });
        await client.downloadTo(sink, target);
        remote = Buffer.concat(chunks);
      } catch {
        remote = null; // no existe todavía
      }
      if (remote && createHash('sha256').update(remote).digest('hex') === localHash) {
        console.log(`🌐 [frontend] ${target} ya está al día`);
        return;
      }

      if (remote) {
        const stamp = new Date().toLocaleString('sv-SE', { timeZone: 'America/Bogota' }).replace(/[-:]/g, '').replace(' ', '-').slice(0, 13);
        const dir = target.substring(0, target.lastIndexOf('/') + 1);
        const backup = `${dir}gipfel_backup_${stamp}.html`;
        await client.uploadFrom(Readable.from(remote), backup);
        console.log(`🌐 [frontend] respaldo guardado en ${backup}`);
      }

      await client.uploadFrom(Readable.from(content), target);
      console.log(`🌐 [frontend] ✅ publicado ${target} (${content.length} bytes)`);
    } finally {
      client.close();
    }
  }
}
