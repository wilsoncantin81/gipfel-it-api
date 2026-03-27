const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando base de datos...');

  const adminHash = await bcrypt.hash('Admin2024!', 12);
  const techHash  = await bcrypt.hash('Tecnico2024!', 12);

  await prisma.user.upsert({
    where: { email: 'admin@grupogipfel.com' },
    update: {},
    create: { name: 'Admin Gipfel', email: 'admin@grupogipfel.com', passwordHash: adminHash, role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { email: 'tecnico@grupogipfel.com' },
    update: {},
    create: { name: 'Técnico Gipfel', email: 'tecnico@grupogipfel.com', passwordHash: techHash, role: 'TECNICO' },
  });

  const types = [
    { name: 'PC Torre',     icon: '🖥️', fieldSchema: ['Procesador','Board','Disco','RAM','Tarjeta de video'] },
    { name: 'Portátil',     icon: '💻', fieldSchema: ['Procesador','Disco','RAM','Batería'] },
    { name: 'Servidor',     icon: '🗄️', fieldSchema: ['Procesador','RAM','Almacenamiento','RAID'] },
    { name: 'Impresora',    icon: '🖨️', fieldSchema: ['Tipo impresión','Conectividad'] },
    { name: 'DVR',          icon: '📹', fieldSchema: ['N° canales','Disco duro','Resolución'] },
    { name: 'NVR',          icon: '📹', fieldSchema: ['N° canales','Disco duro','Resolución','Protocolo'] },
    { name: 'Router',       icon: '📡', fieldSchema: ['Puertos','Frecuencia','Estándar WiFi'] },
    { name: 'Switch',       icon: '🔀', fieldSchema: ['Puertos','Velocidad','Administrable'] },
    { name: 'UPS',          icon: '⚡', fieldSchema: ['Potencia (VA)','Autonomía','Tomas'] },
    { name: 'Monitor',      icon: '🖥',  fieldSchema: ['Tamaño','Resolución','Panel'] },
    { name: 'Cámara IP',    icon: '📷', fieldSchema: ['Resolución','Lente','Visión nocturna'] },
    { name: 'Firewall',     icon: '🛡️', fieldSchema: ['Throughput','VPN','Políticas'] },
    { name: 'Access Point', icon: '📶', fieldSchema: ['Frecuencia','Estándar','Cobertura'] },
    { name: 'Teléfono IP',  icon: '☎️', fieldSchema: ['Líneas','Protocolo SIP'] },
    { name: 'Alarma',       icon: '🚨', fieldSchema: ['Zonas','Tipo','Central'] },
  ];

  for (const t of types) {
    const exists = await prisma.assetType.findFirst({ where: { name: t.name } });
    if (!exists) await prisma.assetType.create({ data: t });
  }

  console.log('✅ Base de datos lista!');
  console.log('   admin@grupogipfel.com / Admin2024!');
  console.log('   tecnico@grupogipfel.com / Tecnico2024!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
