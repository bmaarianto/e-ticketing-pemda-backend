import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validasi otomatis buat semua DTO yang masuk (dipakai nanti di fase auth & ticketing)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Izinin frontend Next.js (jalan di port beda) buat akses API ini
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Backend jalan di http://localhost:${port}`);
}
bootstrap();
