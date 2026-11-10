import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as ExcelJS from 'exceljs';
import { encrypt, decrypt } from '../common/crypto.util';
import * as https from 'https';
import * as http from 'http';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

const COMPANY = {
  name: 'Grupo Gipfel',
  address: 'Calle 96 #68F-24, Bogotá',
  phone: '601 811 9749',
  mobile: '311 503 5734',
  email: 'info@grupogipfel.com',
  web: 'www.grupogipfel.com',
  logoUrl: 'https://www.grupogipfel.com/imagenes/logo-gipfel.png',
};

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(q: any) {
    const where: any = {};
    if (q.clientId) where.clientId = q.clientId;
    if (q.status) where.status = q.status;

    if (q.assetTypeId) {
      const ids = Array.isArray(q.assetTypeId) ? q.assetTypeId : [q.assetTypeId];
      const filtered = ids.filter(Boolean);
      if (filtered.length === 1) where.assetTypeId = filtered[0];
      else if (filtered.length > 1) where.assetTypeId = { in: filtered };
    }

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
        code: createAssetDto.code || null,
        name: createAssetDto.name,
        clientId: createAssetDto.clientId,
        assetTypeId: createAssetDto.assetTypeId,
        status: createAssetDto.status || 'ACTIVO',
        brand: createAssetDto.brand || null,
        model: createAssetDto.model || null,
        serial: createAssetDto.serial || null,
        location: createAssetDto.location || null,
        supplier: createAssetDto.supplier || null,
        assignedUser: createAssetDto.assignedUser,
        assignedUserId: createAssetDto.assignedUserId || null,
        responsible: createAssetDto.responsible,
        ipAddress: createAssetDto.ipAddress,
        macAddress: createAssetDto.macAddress,
        remoteAccess: createAssetDto.remoteAccess,
        remoteAccessPasswordEnc: createAssetDto.remoteAccessPassword ? encrypt(createAssetDto.remoteAccessPassword) : undefined,
        notes: createAssetDto.notes,
        extraFields: createAssetDto.extraFields ?? {},
        passwordEnc: createAssetDto.password ? encrypt(createAssetDto.password) : undefined,
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
        code: updateAssetDto.code || null,
        name: updateAssetDto.name,
        assetTypeId: updateAssetDto.assetTypeId,
        status: updateAssetDto.status,
        brand: updateAssetDto.brand || null,
        model: updateAssetDto.model || null,
        serial: updateAssetDto.serial || null,
        location: updateAssetDto.location || null,
        supplier: updateAssetDto.supplier || null,
        assignedUser: updateAssetDto.assignedUser,
        assignedUserId: updateAssetDto.assignedUserId !== undefined ? (updateAssetDto.assignedUserId || null) : undefined,
        responsible: updateAssetDto.responsible,
        ipAddress: updateAssetDto.ipAddress,
        macAddress: updateAssetDto.macAddress,
        remoteAccess: updateAssetDto.remoteAccess,
        ...(updateAssetDto.remoteAccessPassword ? { remoteAccessPasswordEnc: encrypt(updateAssetDto.remoteAccessPassword) } : {}),
        notes: updateAssetDto.notes,
        extraFields: updateAssetDto.extraFields ?? undefined,
        ...(updateAssetDto.password ? { passwordEnc: encrypt(updateAssetDto.password) } : {}),
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

  private async fetchImageBuffer(url: string): Promise<Buffer | null> {
    return new Promise((resolve) => {
      const lib = url.startsWith('https') ? https : http;
      lib.get(url, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', () => resolve(null));
      }).on('error', () => resolve(null));
    });
  }

  async getAssetPDF(id: string): Promise<Buffer> {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        client: true,
        assetType: true,
        maintenanceRecords: {
          include: { technician: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!asset) throw new Error('Asset not found');

    const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: true });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));

    const pageW = 595.28;
    const mg = 36;
    const cw = pageW - mg * 2;

    const navy  = '#0A4F8C';
    const cyan  = '#00AEEF';
    const gray1 = '#f8fafc';
    const gray2 = '#e2e8f0';
    const gray3 = '#64748b';
    const white = '#ffffff';
    const dark  = '#1a2332';

    let y = 0;

    // ── HEADER ──────────────────────────────────────────────────────
    const headerH = 90;
    doc.rect(0, 0, pageW, headerH).fill(white);
    doc.rect(0, headerH - 4, pageW, 4).fill(cyan);

    try {
      const logoBuf = await this.fetchImageBuffer(COMPANY.logoUrl);
      if (logoBuf) {
        const logoW = 148, logoH = 50;
        const logoX = mg - 4, logoY = 12;
        doc.image(logoBuf, logoX + 4, logoY + 4, { height: logoH - 8, fit: [logoW - 8, logoH - 8] });
      }
    } catch {}

    doc.fillColor(navy).fontSize(8).font('Helvetica')
      .text(COMPANY.web, pageW - mg - 150, 22, { width: 150, align: 'right' })
      .text(COMPANY.phone + ' | ' + COMPANY.mobile, pageW - mg - 150, 34, { width: 150, align: 'right' })
      .text(COMPANY.email, pageW - mg - 150, 46, { width: 150, align: 'right' });

    doc.fillColor(navy).fontSize(7.5).font('Helvetica-Bold')
      .text('HOJA DE VIDA DE ACTIVO TI', mg, 66, { width: 200 });

    y = headerH + 4;

    // ── RIBBON (nombre del activo) ───────────────────────────────────
    const ribbonH = 30;
    doc.rect(0, y, pageW, ribbonH).fill(cyan);
    doc.fillColor(white).fontSize(13).font('Helvetica-Bold')
      .text(asset.name, 0, y + 8, { width: pageW * 0.6, align: 'center' });
    const statusLabel = { ACTIVO: 'ACTIVO', EN_MANTENIMIENTO: 'EN MANTENIMIENTO', DADO_DE_BAJA: 'DADO DE BAJA' }[asset.status] || asset.status;
    const statusColor = { ACTIVO: '#16a34a', EN_MANTENIMIENTO: '#d97706', DADO_DE_BAJA: '#dc2626' }[asset.status] || '#64748b';
    doc.rect(pageW * 0.75, y + 5, 110, 20).fill(statusColor);
    doc.fillColor(white).fontSize(8).font('Helvetica-Bold')
      .text(statusLabel, pageW * 0.75, y + 11, { width: 110, align: 'center' });
    y += ribbonH + 10;

    // ── HELPER: draw section header ──────────────────────────────────
    const sectionHeader = (title: string) => {
      doc.rect(mg, y, cw, 20).fill(navy);
      doc.fillColor(white).fontSize(8.5).font('Helvetica-Bold')
        .text(title, mg + 8, y + 6, { width: cw - 16 });
      y += 22;
    };

    // ── HELPER: draw field row ───────────────────────────────────────
    let rowAlt = false;
    const fieldRow = (label: string, value: string) => {
      const rh = 18;
      if (y + rh > 800) { doc.addPage(); y = 36; }
      if (rowAlt) doc.rect(mg, y, cw, rh).fill(gray1);
      rowAlt = !rowAlt;
      doc.fillColor(navy).fontSize(8).font('Helvetica-Bold')
        .text(label, mg + 6, y + 5, { width: cw * 0.35 });
      doc.fillColor(dark).fontSize(8).font('Helvetica')
        .text(value || '–', mg + 6 + cw * 0.35, y + 5, { width: cw * 0.6 });
      doc.rect(mg, y + rh - 0.5, cw, 0.5).fill(gray2);
      y += rh;
    };

    const fmtDate = (d: Date | null | undefined) =>
      d ? new Date(d).toLocaleDateString('es-CO') : '–';

    // ── INFORMACIÓN GENERAL ─────────────────────────────────────────
    sectionHeader('INFORMACIÓN GENERAL');
    rowAlt = false;
    fieldRow('Código / Inventario', asset.code || '–');
    fieldRow('Nombre', asset.name);
    fieldRow('Cliente', asset.client?.businessName || '–');
    fieldRow('Tipo de activo', asset.assetType?.name || '–');
    fieldRow('Estado', statusLabel);
    fieldRow('Proveedor', asset.supplier || '–');
    fieldRow('Usuario asignado', asset.assignedUser || '–');
    fieldRow('Responsable', asset.responsible || '–');
    fieldRow('Ubicación', asset.location || '–');
    y += 6;

    // ── ESPECIFICACIONES TÉCNICAS ────────────────────────────────────
    sectionHeader('ESPECIFICACIONES TÉCNICAS');
    rowAlt = false;
    fieldRow('Marca', asset.brand || '–');
    fieldRow('Modelo', asset.model || '–');
    fieldRow('Serial / N° Serie', asset.serial || '–');

    // Extra fields (dynFields + extraFields, excluding passwords)
    const efRaw = (asset.extraFields as Record<string, string>) || {};
    const dynRaw = (asset.dynFields as Record<string, string>) || {};
    const allExtras: Record<string, string> = { ...efRaw, ...dynRaw };
    for (const [k, v] of Object.entries(allExtras)) {
      const kl = k.toLowerCase();
      if (kl.includes('contrase') || kl.includes('password') || kl.includes('clave') || kl.includes('pass')) continue;
      fieldRow(k, String(v));
    }
    y += 6;

    // ── RED Y ACCESO ─────────────────────────────────────────────────
    sectionHeader('RED Y ACCESO REMOTO');
    rowAlt = false;
    fieldRow('Dirección IP', asset.ipAddress || '–');
    fieldRow('Dirección MAC', asset.macAddress || '–');
    fieldRow('ID AnyDesk / Acceso Remoto', asset.remoteAccess || '–');
    // Note: passwords intentionally excluded
    y += 6;

    // ── GARANTÍA Y FECHAS ────────────────────────────────────────────
    sectionHeader('GARANTÍA Y FECHAS');
    rowAlt = false;
    fieldRow('Fecha de compra', fmtDate(asset.purchaseDate));
    fieldRow('Garantía hasta', fmtDate(asset.warrantyUntil));
    fieldRow('Próximo mantenimiento', fmtDate(asset.nextMaintenance));
    y += 6;

    // ── NOTAS ────────────────────────────────────────────────────────
    if ((asset as any).notes) {
      sectionHeader('NOTAS');
      doc.rect(mg, y, cw, 2).fill(gray2);
      y += 6;
      doc.fillColor(dark).fontSize(8).font('Helvetica')
        .text(String((asset as any).notes), mg + 8, y, { width: cw - 16 });
      y += doc.heightOfString(String((asset as any).notes), { width: cw - 16 }) + 10;
    }

    // ── HISTORIAL DE MANTENIMIENTO ───────────────────────────────────
    if (asset.maintenanceRecords.length > 0) {
      if (y + 60 > 800) { doc.addPage(); y = 36; }
      sectionHeader('HISTORIAL DE MANTENIMIENTO');
      rowAlt = false;

      for (const rec of asset.maintenanceRecords) {
        if (y + 50 > 800) { doc.addPage(); y = 36; }

        // Type badge
        const typeColors: Record<string, string> = {
          PREVENTIVO: '#16a34a', CORRECTIVO: '#d97706',
          INSTALACION: '#0A4F8C', CONFIGURACION: '#7c3aed',
        };
        const tc = typeColors[rec.type] || '#64748b';
        doc.rect(mg, y, cw, 1).fill(gray2);
        y += 4;

        // Date + type row
        doc.rect(mg, y, 70, 16).fill(tc);
        doc.fillColor(white).fontSize(7.5).font('Helvetica-Bold')
          .text(rec.type, mg + 2, y + 4, { width: 66, align: 'center' });
        doc.fillColor(gray3).fontSize(7.5).font('Helvetica')
          .text(fmtDate(rec.date || rec.createdAt), mg + 76, y + 4);
        if (rec.technician?.name) {
          doc.text('Técnico: ' + rec.technician.name, mg + 180, y + 4);
        }
        if (rec.timeSpent) {
          doc.text(rec.timeSpent + ' h', pageW - mg - 40, y + 4, { width: 40, align: 'right' });
        }
        y += 20;

        // Description
        doc.fillColor(dark).fontSize(8).font('Helvetica')
          .text(rec.description, mg + 10, y, { width: cw - 20 });
        y += doc.heightOfString(rec.description, { width: cw - 20 }) + 4;

        // Work done
        if (rec.workDone) {
          doc.fillColor(gray3).fontSize(7.5).font('Helvetica-Oblique')
            .text('Trabajo: ' + rec.workDone, mg + 10, y, { width: cw - 20 });
          y += doc.heightOfString('Trabajo: ' + rec.workDone, { width: cw - 20 }) + 4;
        }
        y += 4;
      }
    }

    // ── FOOTER ───────────────────────────────────────────────────────
    if (y + 40 > 800) { doc.addPage(); y = 36; }
    y += 10;
    doc.rect(mg, y, cw, 1).fill(cyan);
    y += 6;
    doc.fillColor(gray3).fontSize(7.5).font('Helvetica')
      .text(
        `${COMPANY.name}  ·  ${COMPANY.address}  ·  Tel: ${COMPANY.phone}  ·  Cel: ${COMPANY.mobile}  ·  ${COMPANY.email}  ·  ${COMPANY.web}`,
        mg, y, { width: cw, align: 'center' },
      );
    y += 12;
    doc.fillColor(gray3).fontSize(7).font('Helvetica')
      .text(`Generado el ${new Date().toLocaleString('es-CO')}`, mg, y, { width: cw, align: 'center' });

    doc.end();
    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
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

    const plain = asset.passwordEnc ? decrypt(asset.passwordEnc) : null;
    return {
      code: asset.code,
      password: plain || null,
      hasPassword: !!asset.passwordEnc,
    };
  }

  async getRemotePassword(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      select: { code: true, remoteAccessPasswordEnc: true },
    });

    if (!asset) throw new Error('Asset not found');

    const enc = (asset as any).remoteAccessPasswordEnc;
    const plain = enc ? decrypt(enc) : null;
    return {
      code: asset.code,
      password: plain || null,
      hasPassword: !!enc,
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

    const clientName = assets.length > 0 && assets[0].client?.businessName
      ? assets[0].client.businessName
      : null;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Activos');

    const baseHeaders = ['código', 'nombre', 'marca', 'modelo', 'serial', 'tipo', 'cliente', 'estado', 'ubicación', 'ip', 'mac', 'fecha_compra', 'garantía', 'próx_mant', 'responsable', 'proveedor', 'usuario_asignado'];

    const dynamicFieldsSet = new Set<string>();
    assets.forEach(a => {
      if (a.notes) {
        const parts = a.notes.split('|');
        parts.forEach(part => {
          const match = part.trim().match(/^([^:]+):/);
          if (match) {
            const fieldName = match[1].trim().toLowerCase().replace(/\s+/g, '_');
            dynamicFieldsSet.add(fieldName);
          }
        });
      }
    });

    const dynamicHeaders = Array.from(dynamicFieldsSet).sort();
    const allHeaders = [...baseHeaders, ...dynamicHeaders];

    worksheet.columns = allHeaders.map(h => ({
      header: h.charAt(0).toUpperCase() + h.slice(1).replace(/_/g, ' '),
      key: h,
      width: 18,
    }));

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002668' } };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

    assets.forEach(a => {
      const rowData: any = {
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
        fecha_compra: a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString('es-CO') : '',
        garantía: a.warrantyUntil ? new Date(a.warrantyUntil).toLocaleDateString('es-CO') : '',
        próx_mant: a.nextMaintenance ? new Date(a.nextMaintenance).toLocaleDateString('es-CO') : '',
        responsable: a.responsible || '',
        proveedor: (a as any).supplier || '',
        usuario_asignado: (a as any).assignedUser || '',
      };

      if (a.notes) {
        const parts = a.notes.split('|');
        parts.forEach(part => {
          const trimmedPart = part.trim();
          const colonIndex = trimmedPart.indexOf(':');
          if (colonIndex > 0) {
            const fieldName = trimmedPart.substring(0, colonIndex).trim().toLowerCase().replace(/\s+/g, '_');
            const fieldValue = trimmedPart.substring(colonIndex + 1).trim();
            rowData[fieldName] = fieldValue;
          }
        });
      }

      worksheet.addRow(rowData);
    });

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        if (rowNumber > 1) {
          cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return { buffer, clientName } as any;
  }
}
