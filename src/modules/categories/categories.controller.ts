import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('categories')
export class CategoriesController {
  constructor(private prisma: PrismaService) {}

  // Role apapun boleh akses, asal login — dipake buat isi dropdown di form pengajuan tiket
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.prisma.category.findMany({ orderBy: { namaKategori: 'asc' } });
  }
}
