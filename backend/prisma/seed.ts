import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Hlavní sklad',
      zones: ['A', 'B', 'C']
    }
  });

  console.log('✓ Warehouse created');

  // Create rails (grid layout: 5 rows x 8 columns)
  const rails = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 8; col++) {
      const code = `R-${String(row * 8 + col + 1).padStart(3, '0')}`;
      const rail = await prisma.rail.upsert({
        where: { code },
        update: {},
        create: {
          code,
          name: `Kolejnice ${code}`,
          warehouseId: warehouse.id,
          zone: ['A', 'B', 'C'][row % 3],
          rowIndex: row,
          colIndex: col,
          posIndex: 0,
          x: col * 120,
          y: row * 80,
          width: 100,
          height: 60,
          isActive: true
        }
      });
      rails.push(rail);
    }
  }

  console.log(`✓ Created ${rails.length} rails`);

  // Create test user
  const user = await prisma.user.upsert({
    where: { deviceId: 'test-device-001' },
    update: {},
    create: {
      name: 'Test User',
      deviceId: 'test-device-001',
      role: 'worker'
    }
  });

  console.log('✓ Test user created');

  // Create some test rolls
  const materials = [
    { name: 'Papír lesklý', width: 1200, grammage: 80, color: 'bílá' },
    { name: 'Papír matný', width: 900, grammage: 115, color: 'bílá' },
    { name: 'Karton vlnitý', width: 1500, grammage: 250, color: 'hnědá' },
    { name: 'Fólie stretch', width: 500, grammage: 23, color: 'průhledná' }
  ];

  for (let i = 0; i < 12; i++) {
    const material = materials[i % materials.length];
    const ean = `859500000${String(i + 1).padStart(4, '0')}`;
    const railIndex = i % rails.length;
    
    const roll = await prisma.roll.create({
      data: {
        ean,
        materialName: material.name,
        description: `Testovací role #${i + 1}`,
        widthMm: material.width,
        grammageGm2: material.grammage,
        color: material.color,
        supplier: 'Test Supplier s.r.o.',
        batchNo: `BATCH-2025-${String(i + 1).padStart(3, '0')}`,
        status: 'active'
      }
    });

    await prisma.location.create({
      data: {
        rollId: roll.id,
        railId: rails[railIndex].id,
        placedAt: new Date(),
        lastMovedAt: new Date()
      }
    });

    await prisma.movement.create({
      data: {
        type: 'RECEIVE',
        rollId: roll.id,
        toRailId: rails[railIndex].id,
        userId: user.id,
        deviceId: user.deviceId,
        at: new Date()
      }
    });
  }

  console.log('✓ Created 12 test rolls');
  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
