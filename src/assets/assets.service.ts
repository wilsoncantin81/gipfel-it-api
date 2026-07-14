import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

const COMPANY = {
  name: 'Grupo Gipfel',
  address: 'Calle 96 #68F-24, Bogotá',
  phone: '601 811 9749',
  mobile: '311 503 5734',
  email: 'info@grupogipfel.com',
  web: 'www.grupogipfel.com',
  logoUrl: 'https://www.grupogipfel.com/imagenes/logo-gipfel.png',
  logoDarkUrl: 'https://www.grupogipfel.com/imagenes/logo-gipfel2.png',
};

const LOGO_B64 = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAIBAQEBAQIBAQECAgICAgQDAgICAgUEBAMEBgUGBgYFBgYGBwkIBgcJBwYGCAsICQoKCgoKBggLDAsKDAkKCgr/2wBDAQICAgICAgUDAwUKBwYHCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgr/wAARCAHKA9oDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiior5L6S2ZNNuYYpiPkknhMij6qGUn8xTSuxNtK6VyWo7u8tNPtnvL+6jghjXMkszhVUepJ4FeeeLvgr8S/G2+G//AGnfFek27/et/DNjYWmPpI9vLKP++68x8Sf8Eufgn45uRe/EX4sfEvxJNuz5uu+K1nOfxhGPwr28JgcllZ4vGcq/uU5Tf/k3IvxZ8tmObcTwusvy3nfepWhTX/kqqv8ABHo3jf8AbT/ZS+HjPF4o+PXhxJY/9ZBY3wu5UPoUt97A+2M15J4w/wCCwf7Jvh5ni8PQeJtfYfcew0lYo2+puHjYD/gJ+lXYf+CRn7HcQAfR/EEmO7663P5KKlb/AAJJ/sbHp4b1wfTXpa+pwcPC6hZ4ieJqP0hFfcnf/wAmPgcyq+POLusJTwVFf4qk5fe48v8A5KeQeKf+C3cCs0Pgn9nx2H8FxqniAL+cccJ/9Drz3xF/wWa/aZ1JmTQPBnhDTIz91vsNxNIPxabaf++a+l7r/gkJ+yDcAiG28TQZ7xa3nH/fUZrE1T/gjB+zJdKW0zx142tX7Z1C1kUfgbYH9a+swWceDlC1sJL1mpS/OcvyPz7M+G/pK4u98wh6U5Qh+Kpxf3s+Ttb/AOCpv7bOrs32b4p22no3VLLw/Z8fQyRMw/OuY1L9vn9sbVmLXX7QOvIT1+zSpD/6LVcV9X67/wAERfBk4P8AwjPx/wBUtT/CL/Qo7j/0CWOuD8T/APBFH4zWYZvB/wAYPDOoY+6NQt7i0Lf98LKB+dfX4HiXwmdlSjRg/Ojb8XC34n5xmvBH0ho3lXniKi/u4nm+6Kq3/A+crr9rz9rq8YtN+0f44GevleKLpB/464qm37T/AO0s7bn/AGh/HJJ6k+Lbz/47XpvjH/glt+2f4SVprf4bW2sQp96XR9YgkP4I7I5/Ba8h8c/BL4xfDNm/4WF8LPEGiqp/1up6RNDGfcOyhSPcGvs8BiOEMfZYOVCb7R5G/uWp+Z5tg/EfJ7yzGOKppdZ+1S+96P7zVg/ao/adtjm3/AJ7+lv+Cq3/BdD9jH9gG49u/tG6fo8CeX2mLRzb48jsoG/wxvRnH3IH5iviD4b+H/ANk/9j3wHeWfhbwlN4P0NkfU7fvvL9oQ73eqSzzU3FwJZfFBdR77yU5Z3dvNgktLaH/Q/kTgJ32bY4r+P0+IXwt8H/FHxxdeOvDl54s0cXUZbLw/rG/wBq8/ej2BvnN3iGaJpBpDhXMgJPPJH2qzDxr9grzb9s/4Z6vbX3j++uv2YtGeP4oadpoJuFudB8YaLPfXmgqM5bzRvEOuRXk9ySHhGbWZL9NHsKKKK5Dooooqg/vCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/2Q==', 'base64');

function parseDate(d: string | undefined): Date | undefined {
  if (!d) return undefined;
  if (d.includes('T')) return new Date(d);
  return new Date(d + 'T12:00:00-05:00');
}

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(q: any) {
    const where: any = {};
    if (q.clientId) where.clientId = q.clientId;
    if (q.status) where.status = q.status;

    let ids = Array.isArray(q.assetTypeId) ? q.assetTypeId : [q.assetTypeId];
    where.assetTypeId = ids?.length === 1 ? ids[0] : { in: ids };

    if (q.search)
      where.OR = [
        { code: { contains: q.search, mode: 'insensitive' } },
        { name: { contains: q.search, mode: 'insensitive' } },
        { description: { contains: q.search, mode: 'insensitive' } },
      ];

    const [data, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        include: { client: true, type: true },
        orderBy: { createdAt: 'desc' },
        skip: q.skip || 0,
        take: q.take || 20,
      }),
      this.prisma.asset.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    return this.prisma.asset.findUnique({
      where: { id },
      include: { client: true, type: true, maintenanceRecords: true },
    });
  }

  async create(createAssetDto: any) {
    const asset = await this.prisma.asset.create({
      data: {
        code: createAssetDto.code,
        name: createAssetDto.name,
        description: createAssetDto.description,
        clientId: createAssetDto.clientId,
        assetTypeId: createAssetDto.assetTypeId,
        status: createAssetDto.status || 'ACTIVO',
        serialNumber: createAssetDto.serialNumber,
        location: createAssetDto.location,
        purchaseDate: createAssetDto.purchaseDate
          ? parseDate(createAssetDto.purchaseDate)
          : null,
        purchasePrice: createAssetDto.purchasePrice,
        warrantyUntil: createAssetDto.warrantyUntil
          ? parseDate(createAssetDto.warrantyUntil)
          : null,
        nextMaintenance: createAssetDto.nextMaintenance
          ? parseDate(createAssetDto.nextMaintenance)
          : null,
      },
      include: { client: true, type: true },
    });
    return asset;
  }

  async update(id: string, updateAssetDto: any) {
    return this.prisma.asset.update({
      where: { id },
      data: {
        code: updateAssetDto.code,
        name: updateAssetDto.name,
        description: updateAssetDto.description,
        assetTypeId: updateAssetDto.assetTypeId,
        status: updateAssetDto.status,
        serialNumber: updateAssetDto.serialNumber,
        location: updateAssetDto.location,
        purchaseDate: updateAssetDto.purchaseDate
          ? parseDate(updateAssetDto.purchaseDate)
          : null,
        purchasePrice: updateAssetDto.purchasePrice,
        warrantyUntil: updateAssetDto.warrantyUntil
          ? parseDate(updateAssetDto.warrantyUntil)
          : null,
        nextMaintenance: updateAssetDto.nextMaintenance
          ? parseDate(updateAssetDto.nextMaintenance)
          : null,
      },
      include: { client: true, type: true },
    });
  }

  async remove(id: string) {
    return this.prisma.asset.delete({ where: { id } });
  }

  async exportPDF(q: any) {
    const assets = await this.prisma.asset.findMany({
      where: {
        clientId: q.clientId,
        status: q.status || undefined,
        assetTypeId: q.assetTypeId || undefined,
      },
      include: { client: true, type: true },
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reporte de Activos</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; text-align: center; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #4CAF50; color: white; font-weight: bold; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    .company-info { text-align: center; margin-bottom: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="company-info">
    <p><strong>Grupo Gipfel</strong></p>
    <p>Calle 96 #68F-24, Bogotá | Tel: 601 811 9749</p>
    <p>info@grupogipfel.com</p>
  </div>

  <h1>Reporte de Activos</h1>
  <p style="text-align: center; color: #666;">Generado el ${new Date().toLocaleDateString('es-CO')}</p>

  <table>
    <thead>
      <tr>
        <th>Código</th>
        <th>Nombre</th>
        <th>Tipo</th>
        <th>Cliente</th>
        <th>Estado</th>
        <th>Ubicación</th>
      </tr>
    </thead>
    <tbody>
      ${assets.map(a => `
        <tr>
          <td>${a.code || ''}</td>
          <td>${a.name || ''}</td>
          <td>${a.type?.name || ''}</td>
          <td>${a.client?.businessName || ''}</td>
          <td>${a.status || ''}</td>
          <td>${a.location || ''}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <p style="margin-top: 30px; font-size: 12px; color: #999;">
    Total de activos: ${assets.length}
  </p>
</body>
</html>
    `;

    return html;
  }

  async exportExcel(q: any) {
    const assets = await this.prisma.asset.findMany({
      where: {
        clientId: q.clientId,
        status: q.status || undefined,
        assetTypeId: q.assetTypeId || undefined,
      },
      include: { client: true, type: true },
    });

    const csv = [
      ['Código', 'Nombre', 'Tipo', 'Cliente', 'Estado', 'Ubicación', 'Número de Serie'],
      ...assets.map(a => [
        a.code || '',
        a.name || '',
        a.type?.name || '',
        a.client?.businessName || '',
        a.status || '',
        a.location || '',
        a.serialNumber || '',
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csv;
  }
}
