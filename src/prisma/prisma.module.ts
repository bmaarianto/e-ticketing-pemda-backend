import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global() biar PrismaService bisa langsung dipakai di module manapun
// tanpa perlu import PrismaModule berkali-kali
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
