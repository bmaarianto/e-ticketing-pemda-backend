import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // upsert biar aman dijalanin berkali-kali (ga bikin duplikat kalau seed diulang)
  const categories = [
    { namaKategori: 'Jaringan', slaHari: 1 },
    { namaKategori: 'Server', slaHari: 2 },
    { namaKategori: 'Website', slaHari: 2 },
    { namaKategori: 'Hardware', slaHari: 3 },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { namaKategori: c.namaKategori },
      update: {},
      create: c,
    });
  }

  console.log('Seed kategori selesai:', categories.map((c) => c.namaKategori).join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
