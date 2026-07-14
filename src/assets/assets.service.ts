import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as ExcelJS from 'exceljs';

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

  private escapeCsv(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
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
    * { margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { background: white; padding: 40px; max-width: 900px; margin: 0 auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 4px solid #002668;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header-left h1 { color: #002668; font-size: 24px; }
    .header-left p { color: #666; font-size: 14px; margin-top: 5px; }
    .logo { text-align: right; }
    .logo img { height: 60px; }
    .section { margin-bottom: 25px; }
    .section-title {
      background: linear-gradient(135deg, #002668 0%, #003d99 100%);
      color: white;
      padding: 12px 15px;
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 15px;
      border-radius: 4px;
    }
    .row {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .row:last-child { border-bottom: none; }
    .label {
      font-weight: 600;
      width: 30%;
      color: #002668;
      font-size: 13px;
    }
    .value {
      width: 70%;
      color: #333;
      font-size: 13px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
    }
    .status-ACTIVO { background: #d4edda; color: #155724; }
    .status-EN_MANTENIMIENTO { background: #fff3cd; color: #856404; }
    .status-DADO_DE_BAJA { background: #f8d7da; color: #721c24; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #002668;
      text-align: center;
      color: #666;
      font-size: 11px;
    }
    .company-info { margin-top: 10px; font-weight: bold; color: #002668; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-left">
        <h1>Hoja de Vida de Activo</h1>
        <p>Código: <strong>${asset.code || 'N/A'}</strong></p>
      </div>
      <div class="logo">
        <img src="https://www.grupogipfel.com/imagenes/logo-gipfel.png" alt="Grupo Gipfel">
      </div>
    </div>

    <div class="section">
      <div class="section-title">📋 INFORMACIÓN GENERAL</div>
      <div class="row">
        <div class="label">Código:</div>
        <div class="value">${asset.code || 'N/A'}</div>
      </div>
      <div class="row">
        <div class="label">Nombre:</div>
        <div class="value"><strong>${asset.name}</strong></div>
      </div>
      <div class="row">
        <div class="label">Cliente:</div>
        <div class="value">${asset.client?.businessName || 'N/A'}</div>
      </div>
      <div class="row">
        <div class="label">Tipo de Activo:</div>
        <div class="value">${asset.assetType?.name || 'N/A'}</div>
      </div>
      <div class="row">
        <div class="label">Estado:</div>
        <div class="value"><span class="status-badge status-${asset.status}">${asset.status}</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">🏷️ ESPECIFICACIONES TÉCNICAS</div>
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
      <div class="section-title">📅 GARANTÍA Y MANTENIMIENTO</div>
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
      <div class="section-title">🌐 ACCESO REMOTO</div>
      <div class="row">
        <div class="label">Dirección IP:</div>
        <div class="value">${asset.ipAddress || 'N/A'}</div>
      </div>
      <div class="row">
        <div class="label">Dirección MAC:</div>
        <div class="value">${asset.macAddress || 'N/A'}</div>
      </div>
      <div class="row">
        <div class="label">Acceso Remoto:</div>
        <div class="value">${asset.remoteAccess || 'No disponible'}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">📝 NOTAS</div>
      <div style="padding: 10px; background: #f9f9f9; border-left: 3px solid #002668; border-radius: 4px;">
        ${asset.notes || '<em>Sin notas adicionales</em>'}
      </div>
    </div>

    <div class="footer">
      <div class="company-info">Grupo Gipfel</div>
      <p>Calle 96 #68F-24, Bogotá | Tel: 601 811 9749 | Email: info@grupogipfel.com</p>
      <p>Documento generado el ${new Date().toLocaleDateString('es-CO')} a las ${new Date().toLocaleTimeString('es-CO')}</p>
    </div>
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
    * { margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 4px solid #002668;
    }
    .header-content h1 { color: #002668; font-size: 28px; }
    .header-content p { color: #666; margin-top: 5px; }
    .logo { text-align: right; }
    .logo img { height: 70px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    th {
      background: linear-gradient(135deg, #002668 0%, #003d99 100%);
      color: white;
      padding: 15px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
    }
    td {
      padding: 12px 15px;
      border-bottom: 1px solid #e0e0e0;
      font-size: 12px;
    }
    tr:hover { background: #f9f9f9; }
    tr:nth-child(even) { background: #f5f5f5; }
    .status {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
    }
    .status-ACTIVO { background: #d4edda; color: #155724; }
    .status-EN_MANTENIMIENTO { background: #fff3cd; color: #856404; }
    .status-DADO_DE_BAJA { background: #f8d7da; color: #721c24; }
    .footer {
      margin-top: 30px;
      text-align: center;
      color: #666;
      font-size: 12px;
      border-top: 2px solid #002668;
      padding-top: 15px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-content">
      <h1>Reporte de Activos</h1>
      <p>Generado el ${new Date().toLocaleDateString('es-CO')} | Total: ${assets.length} activos</p>
    </div>
    <div class="logo">
      <img src="https://www.grupogipfel.com/imagenes/logo-gipfel.png" alt="Grupo Gipfel">
    </div>
  </div>

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
          <td><strong>${a.code || 'N/A'}</strong></td>
          <td>${a.name}</td>
          <td>${a.brand || 'N/A'}</td>
          <td>${a.model || 'N/A'}</td>
          <td>${a.assetType?.name || 'N/A'}</td>
          <td>${a.client?.businessName || 'N/A'}</td>
          <td><span class="status status-${a.status}">${a.status}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p><strong>Grupo Gipfel</strong></p>
    <p>Calle 96 #68F-24, Bogotá | Tel: 601 811 9749 | info@grupogipfel.com</p>
  </div>
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

    // Encontrar máximo número de componentes de notas para crear columnas dinámicas
    let maxNoteComponents = 0;
    assets.forEach(a => {
      if (a.notes) {
        const parts = a.notes.split('|').length;
        if (parts > maxNoteComponents) maxNoteComponents = parts;
      }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Activos');

    // Encabezados base
    const baseHeaders = ['Código', 'Nombre', 'Marca', 'Modelo', 'Serial', 'Tipo', 'Cliente', 'Estado', 'Ubicación', 'IP', 'MAC', 'Fecha Compra', 'Garantía', 'Próx Mant.', 'Responsable'];

    // Agregar encabezados dinámicos para notas
    const noteHeaders = maxNoteComponents > 0 ? Array.from({ length: maxNoteComponents }, (_, i) => `Nota ${i + 1}`) : ['Notas'];
    const allHeaders = [...baseHeaders, ...noteHeaders];

    worksheet.columns = allHeaders.map((h, i) => ({
      header: h,
      key: i < baseHeaders.length ? baseHeaders[i].toLowerCase().replace(' ', '') : `nota${i - baseHeaders.length + 1}`,
      width: h.includes('Nota') ? 20 : 15,
    }));

    // Estilo encabezados
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002668' } };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Datos
    assets.forEach(a => {
      const noteParts = a.notes ? a.notes.split('|').map(n => n.trim()) : [];
      const notesPadded = [...noteParts, ...Array(maxNoteComponents - noteParts.length).fill('')];

      const rowData = {
        código: a.code || '',
        nombre: a.name || '',
        marca: a.brand || '',
        modelo: a.model || '',
        serial: a.serial || '',
        tipo: a.assetType?.name || '',
        cliente: a.client?.businessName || '',
        estado: a.status || '',
        ubicación: a.location || '',
        ip: a.ipAddress || '',
        mac: a.macAddress || '',
        fechacompra: a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString('es-CO') : '',
        garantía: a.warrantyUntil ? new Date(a.warrantyUntil).toLocaleDateString('es-CO') : '',
        próxmant: a.nextMaintenance ? new Date(a.nextMaintenance).toLocaleDateString('es-CO') : '',
        responsable: a.responsible || '',
      };

      // Agregar notas divididas
      notesPadded.forEach((note, i) => {
        rowData[`nota${i + 1}`] = note;
      });

      worksheet.addRow(rowData);
    });

    // Alinear datos
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        if (rowNumber > 1) {
          cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as any;
  }
}
