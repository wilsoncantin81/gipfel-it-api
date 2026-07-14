import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

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
        { brand: { contains: q.search, mode: 'insensitive' } },
      ];

    const [data, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        include: { client: true, assetType: true },
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
      include: { client: true, assetType: true, maintenanceRecords: true },
    });
  }

  async create(createAssetDto: any) {
    const asset = await this.prisma.asset.create({
      data: {
        code: createAssetDto.code,
        name: createAssetDto.name,
        clientId: createAssetDto.clientId,
        assetTypeId: createAssetDto.assetTypeId,
        status: createAssetDto.status || 'ACTIVO',
        brand: createAssetDto.brand,
        model: createAssetDto.model,
        serial: createAssetDto.serial,
        location: createAssetDto.location,
        purchaseDate: createAssetDto.purchaseDate ? new Date(createAssetDto.purchaseDate) : null,
        warrantyUntil: createAssetDto.warrantyUntil ? new Date(createAssetDto.warrantyUntil) : null,
        nextMaintenance: createAssetDto.nextMaintenance ? new Date(createAssetDto.nextMaintenance) : null,
      },
      include: { client: true, assetType: true },
    });
    return asset;
  }

  async update(id: string, updateAssetDto: any) {
    return this.prisma.asset.update({
      where: { id },
      data: {
        code: updateAssetDto.code,
        name: updateAssetDto.name,
        assetTypeId: updateAssetDto.assetTypeId,
        status: updateAssetDto.status,
        brand: updateAssetDto.brand,
        model: updateAssetDto.model,
        serial: updateAssetDto.serial,
        location: updateAssetDto.location,
        purchaseDate: updateAssetDto.purchaseDate ? new Date(updateAssetDto.purchaseDate) : null,
        warrantyUntil: updateAssetDto.warrantyUntil ? new Date(updateAssetDto.warrantyUntil) : null,
        nextMaintenance: updateAssetDto.nextMaintenance ? new Date(updateAssetDto.nextMaintenance) : null,
      },
      include: { client: true, assetType: true },
    });
  }

  async remove(id: string) {
    return this.prisma.asset.delete({ where: { id } });
  }

  async getAssetPDF(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: { client: true, assetType: true },
    });

    if (!asset) throw new Error('Asset not found');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Hoja de Vida - ${asset.code}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
    .section { margin: 20px 0; }
    .section-title { background: #4CAF50; color: white; padding: 10px; font-weight: bold; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
    .label { font-weight: bold; width: 40%; }
    .value { width: 60%; }
    .qr { text-align: center; margin: 20px 0; }
    .qr img { width: 150px; height: 150px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${asset.name}</h1>
    <p>Código: ${asset.code}</p>
  </div>

  <div class="section">
    <div class="section-title">Información General</div>
    <div class="row">
      <div class="label">Código:</div>
      <div class="value">${asset.code || 'N/A'}</div>
    </div>
    <div class="row">
      <div class="label">Nombre:</div>
      <div class="value">${asset.name}</div>
    </div>
    <div class="row">
      <div class="label">Cliente:</div>
      <div class="value">${asset.client?.businessName || 'N/A'}</div>
    </div>
    <div class="row">
      <div class="label">Tipo:</div>
      <div class="value">${asset.assetType?.name || 'N/A'}</div>
    </div>
    <div class="row">
      <div class="label">Estado:</div>
      <div class="value">${asset.status}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Especificaciones</div>
    <div class="row">
      <div class="label">Marca:</div>
      <div class="value">${asset.brand || 'N/A'}</div>
    </div>
    <div class="row">
      <div class="label">Modelo:</div>
      <div class="value">${asset.model || 'N/A'}</div>
    </div>
    <div class="row">
      <div class="label">Serial:</div>
      <div class="value">${asset.serial || 'N/A'}</div>
    </div>
    <div class="row">
      <div class="label">Ubicación:</div>
      <div class="value">${asset.location || 'N/A'}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Garantía y Mantenimiento</div>
    <div class="row">
      <div class="label">Fecha de Compra:</div>
      <div class="value">${asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString('es-CO') : 'N/A'}</div>
    </div>
    <div class="row">
      <div class="label">Garantía Hasta:</div>
      <div class="value">${asset.warrantyUntil ? new Date(asset.warrantyUntil).toLocaleDateString('es-CO') : 'N/A'}</div>
    </div>
    <div class="row">
      <div class="label">Próximo Mantenimiento:</div>
      <div class="value">${asset.nextMaintenance ? new Date(asset.nextMaintenance).toLocaleDateString('es-CO') : 'N/A'}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Acceso Remoto</div>
    <div class="row">
      <div class="label">IP:</div>
      <div class="value">${asset.ipAddress || 'N/A'}</div>
    </div>
    <div class="row">
      <div class="label">MAC:</div>
      <div class="value">${asset.macAddress || 'N/A'}</div>
    </div>
    <div class="row">
      <div class="label">Acceso Remoto:</div>
      <div class="value">${asset.remoteAccess || 'No disponible'}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Notas</div>
    <p>${asset.notes || 'Sin notas'}</p>
  </div>

  <div class="qr">
    ${asset.qrCodeUrl ? `<img src="${asset.qrCodeUrl}" alt="QR Code">` : '<p>QR no disponible</p>'}
  </div>
</body>
</html>
    `;

    return html;
  }

  async getQR(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      select: { code: true, qrCodeUrl: true },
    });

    if (!asset) throw new Error('Asset not found');

    return {
      code: asset.code,
      qrCodeUrl: asset.qrCodeUrl,
      message: 'QR code for asset',
    };
  }

  async getPassword(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      select: { code: true, passwordEnc: true },
    });

    if (!asset) throw new Error('Asset not found');

    return {
      code: asset.code,
      hasPassword: !!asset.passwordEnc,
      message: 'Password info retrieved - decrypt on frontend',
    };
  }

  async importFromExcel(rows: any[]) {
    if (!rows || !Array.isArray(rows)) {
      throw new Error('Invalid data format');
    }

    const results = {
      created: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const row of rows) {
      try {
        await this.prisma.asset.create({
          data: {
            code: row.code || `AUTO-${Date.now()}`,
            name: row.name,
            clientId: row.clientId,
            assetTypeId: row.assetTypeId,
            brand: row.brand,
            model: row.model,
            serial: row.serial,
            location: row.location,
            status: row.status || 'ACTIVO',
            purchaseDate: row.purchaseDate ? new Date(row.purchaseDate) : null,
            warrantyUntil: row.warrantyUntil ? new Date(row.warrantyUntil) : null,
            nextMaintenance: row.nextMaintenance ? new Date(row.nextMaintenance) : null,
          },
        });
        results.created++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: row.code || 'unknown',
          error: error.message,
        });
      }
    }

    return results;
  }

  async exportPDF(q: any) {
    const assets = await this.prisma.asset.findMany({
      where: {
        clientId: q.clientId,
        status: q.status || undefined,
        assetTypeId: q.assetTypeId || undefined,
      },
      include: { client: true, assetType: true },
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
        <th>Marca</th>
        <th>Modelo</th>
        <th>Tipo</th>
        <th>Cliente</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>
      ${assets.map(a => `
        <tr>
          <td>${a.code || ''}</td>
          <td>${a.name || ''}</td>
          <td>${a.brand || ''}</td>
          <td>${a.model || ''}</td>
          <td>${a.assetType?.name || ''}</td>
          <td>${a.client?.businessName || ''}</td>
          <td>${a.status || ''}</td>
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
      include: { client: true, assetType: true },
    });

    const csv = [
      ['Código', 'Nombre', 'Marca', 'Modelo', 'Serial', 'Tipo', 'Cliente', 'Estado', 'Ubicación'],
      ...assets.map(a => [
        a.code || '',
        a.name || '',
        a.brand || '',
        a.model || '',
        a.serial || '',
        a.assetType?.name || '',
        a.client?.businessName || '',
        a.status || '',
        a.location || '',
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csv;
  }
}
