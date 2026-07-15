"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const ExcelJS = require("exceljs");
const crypto_util_1 = require("../common/crypto.util");
let AssetsService = class AssetsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(q) {
        const where = {};
        if (q.clientId)
            where.clientId = q.clientId;
        if (q.status)
            where.status = q.status;
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
    async findOne(id) {
        return this.prisma.asset.findUnique({
            where: { id },
            include: { client: true, assetType: true, maintenanceRecords: true },
        });
    }
    async create(createAssetDto) {
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
                supplier: createAssetDto.supplier,
                assignedUser: createAssetDto.assignedUser,
                responsible: createAssetDto.responsible,
                ipAddress: createAssetDto.ipAddress,
                macAddress: createAssetDto.macAddress,
                remoteAccess: createAssetDto.remoteAccess,
                notes: createAssetDto.notes,
                extraFields: createAssetDto.extraFields ?? {},
                passwordEnc: createAssetDto.password ? (0, crypto_util_1.encrypt)(createAssetDto.password) : undefined,
                purchaseDate: createAssetDto.purchaseDate ? new Date(createAssetDto.purchaseDate) : null,
                warrantyUntil: createAssetDto.warrantyUntil ? new Date(createAssetDto.warrantyUntil) : null,
                nextMaintenance: createAssetDto.nextMaintenance ? new Date(createAssetDto.nextMaintenance) : null,
            },
            include: { client: true, assetType: true },
        });
        return asset;
    }
    async update(id, updateAssetDto) {
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
                supplier: updateAssetDto.supplier,
                assignedUser: updateAssetDto.assignedUser,
                responsible: updateAssetDto.responsible,
                ipAddress: updateAssetDto.ipAddress,
                macAddress: updateAssetDto.macAddress,
                remoteAccess: updateAssetDto.remoteAccess,
                notes: updateAssetDto.notes,
                extraFields: updateAssetDto.extraFields ?? undefined,
                ...(updateAssetDto.password ? { passwordEnc: (0, crypto_util_1.encrypt)(updateAssetDto.password) } : {}),
                purchaseDate: updateAssetDto.purchaseDate ? new Date(updateAssetDto.purchaseDate) : null,
                warrantyUntil: updateAssetDto.warrantyUntil ? new Date(updateAssetDto.warrantyUntil) : null,
                nextMaintenance: updateAssetDto.nextMaintenance ? new Date(updateAssetDto.nextMaintenance) : null,
            },
            include: { client: true, assetType: true },
        });
    }
    async remove(id) {
        return this.prisma.asset.delete({ where: { id } });
    }
    escapeCsv(value) {
        if (value === null || value === undefined)
            return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }
    async getAssetPDF(id) {
        const asset = await this.prisma.asset.findUnique({
            where: { id },
            include: { client: true, assetType: true },
        });
        if (!asset)
            throw new Error('Asset not found');
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
    async getQR(id) {
        const asset = await this.prisma.asset.findUnique({
            where: { id },
            select: { code: true, qrCodeUrl: true },
        });
        if (!asset)
            throw new Error('Asset not found');
        return {
            code: asset.code,
            qrCodeUrl: asset.qrCodeUrl,
            message: 'QR code for asset',
        };
    }
    async getPassword(id) {
        const asset = await this.prisma.asset.findUnique({
            where: { id },
            select: { code: true, passwordEnc: true },
        });
        if (!asset)
            throw new Error('Asset not found');
        return {
            code: asset.code,
            hasPassword: !!asset.passwordEnc,
            message: 'Password info retrieved - decrypt on frontend',
        };
    }
    async importFromExcel(rows) {
        if (!rows || !Array.isArray(rows)) {
            throw new Error('Invalid data format');
        }
        const results = {
            created: 0,
            failed: 0,
            errors: [],
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
            }
            catch (error) {
                results.failed++;
                results.errors.push({
                    row: row.code || 'unknown',
                    error: error.message,
                });
            }
        }
        return results;
    }
    async exportPDF(q) {
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
    async exportExcel(q) {
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
        const dynamicFieldsSet = new Set();
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
                fecha_compra: a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString('es-CO') : '',
                garantía: a.warrantyUntil ? new Date(a.warrantyUntil).toLocaleDateString('es-CO') : '',
                próx_mant: a.nextMaintenance ? new Date(a.nextMaintenance).toLocaleDateString('es-CO') : '',
                responsable: a.responsible || '',
                proveedor: a.supplier || '',
                usuario_asignado: a.assignedUser || '',
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
        return { buffer, clientName };
    }
};
exports.AssetsService = AssetsService;
exports.AssetsService = AssetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AssetsService);
//# sourceMappingURL=assets.service.js.map