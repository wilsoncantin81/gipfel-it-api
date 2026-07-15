import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as as ExcelJS from 'exceljs';

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(q: any) {
    const where: any = {};
    if (q.clientId) where.clientId = q.clientId;
    if (q.status) where.status = q.status;

    let ids = Array.isArray(q.assetTypeId) ? q.assetTypeId : [q.assetTypeId];
    where.assetTypeId = ids.length === 1 ? ids[0] : { in: ids };

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

  private escapeHtml(value: any): string {
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
      include: { client: true, assetType: true, maintenanceRecords: true },
    });

    if (!asset) throw new Error('Asset not found');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .header h1 {
            margin: 0;
            color: #333;
          }
          .content {
            margin-bottom: 20px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section h2 {
            color: #555;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
      <div class="header">
        <h1>Reporte de Activo</h1>
        <p>Generado el ${new Date().toLocaleDateString('es-CO')}</p>
      </div>
      <div class="content">
        <div class="section">
          <h2>Información General</h2>
          <table>
            <tr>
              <td><strong>Código</strong></td>
              <td>${asset.code || 'N/A'}</td>
              <td><strong>Nombre</strong></td>
              <td>${asset.name || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Marca</strong></td>
              <td>${asset.brand || 'N/A'}</td>
              <td><strong>Modelo</strong></td>
              <td>${asset.model || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Serial</strong></td>
              <td>${asset.serial || 'N/A'}</td>
              <td><strong>Tipo</strong></td>
              <td>${asset.assetType?.name || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Cliente</strong></td>
              <td colspan="3">${asset.client?.businessName || 'N/A'}</td>
            </tr>
            <tr>
              <td><span class="status status-${asset.status}">${asset.status}</span></td>
              <td colspan="3"></td>
            </tr>
          </table>
        </div>
        <div class="section">
          <h2>Ubicación y Detalles</h2>
          <table>
            <tr>
              <td><strong>Ubicación</strong></td>
              <td>${asset.location || 'N/A'}</td>
              <td><strong>IP</strong></td>
              <td>${asset.ipAddress || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>MAC</strong></td>
              <td>${asset.macAddress || 'N/A'}</td>
              <td><strong>Responsable</strong></td>
              <td>${asset.responsible || 'N/A'}</td>
            </tr>
          </table>
        </div>
        <div class="section">
          <h2>Fechas Importantes</h2>
          <table>
            <tr>
              <th>Fecha Compra</th>
              <th>Garantía Hasta</th>
              <th>Próximo Mantenimiento</th>
            </tr>
            <tr>
              <td>${asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString('es-CO') : 'N/A'}</td>
              <td>${asset.warrantyUntil ? new Date(asset.warrantyUntil).toLocaleDateString('es-CO') : 'N/A'}</td>
              <td>${asset.nextMaintenance ? new Date(asset.nextMaintenance).toLocaleDateString('es-CO') : 'N/A'}</td>
            </tr>
          </table>
        </div>
        <div class="section">
          <h2>Historial de Mantenimiento</h2>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              ${asset.maintenanceRecords?.map(record => `<tr><td>${new Date(record.date).toLocaleDateString('es-CO')}</td><td>${record.type}</td><td>${record.description}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="footer">
        <p><strong>Grupo Gipfel</strong></p>
        <p>Calle 96 #68F-24, Bogotá | Tel: 601 811 9749 | info@grupogipfel.com</p>
      </div>
    </body>
    </html>
    `;

    return html as any;
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

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Activos');

    // Encabezados base
    const baseHeaders = ['Código', 'Nombre', 'Marca', 'Modelo', 'Serial', 'Tipo', 'Cliente', 'Estado', 'Ubicación', 'IP', 'MAC', 'Fecha Compra', 'Garantía', 'Próx Mant.', 'Responsable', 'Proveedor', 'Usuario Asignado'];

    // Compilar todos los campos dinámicos de todos los tipos de activos
    const dynamicFieldsSet = new Set<string>();
    assets.forEach(a => {
      if (a.assetType?.fieldSchema && typeof a.assetType.fieldSchema === 'object') {
        const schema = a.assetType.fieldSchema as any;
        if (Array.isArray(schema)) {
          schema.forEach((field: any) => {
            if (field.name) dynamicFieldsSet.add(field.name);
          });
        } else if (schema.fields && Array.isArray(schema.fields)) {
          schema.fields.forEach((field: any) => {
            if (field.name) dynamicFieldsSet.add(field.name);
          });
        }
      }
    });

    const dynamicHeaders = Array.from(dynamicFieldsSet).sort();
    const allHeaders = [...baseHeaders, ...dynamicHeaders];

    worksheet.columns = allHeaders.map((h, i) => ({
      header: h,
      key: h.toLowerCase().replace(/\s+/g, '_').replace(/[áéíóú]/g, x => ({á:'a',é:'e',í:'i',ó:'o',ú:'u'}[x])),
      width: 18,
    }));

    // Estilo encabezados
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002668' } };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Datos
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
        fechacompra: a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString('es-CO') : '',
        garantía: a.warrantyUntil ? new Date(a.warrantyUntil).toLocaleDateString('es-CO') : '',
        próxmant: a.nextMaintenance ? new Date(a.nextMaintenance).toLocaleDateString('es-CO') : '',
        responsable: a.responsible || '',
        proveedor: (a as any).supplier || '',
        usuario_asignado: (a as any).assignedUser || '',
      };

      // Agregar campos dinámicos desde dynFields
      if (a.dynFields && typeof a.dynFields === 'object') {
        const dynFields = a.dynFields as any;
        Object.keys(dynFields).forEach(key => {
          const headerKey = key.toLowerCase().replace(/\s+/g, '_').replace(/[áéíóú]/g, x => ({á:'a',é:'e',í:'i',ó:'o',ú:'u'}[x]));
          rowData[headerKey] = dynFields[key] || '';
        });
      }

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
