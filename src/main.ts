import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Validasi otomatis buat semua DTO yang masuk
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Izinin frontend Next.js (jalan di port beda) buat akses API ini
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // File lampiran tiket yang diupload jadi bisa diakses lewat
  // http://localhost:4000/uploads/nama-file.png
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Backend jalan di http://localhost:${port}`);
}
bootstrap();
