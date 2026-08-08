import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateTicketDto, attachmentUrl?: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new BadRequestException('Kategori tidak ditemukan');
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        judul: dto.judul,
        deskripsi: dto.deskripsi,
        attachmentUrl,
        // status default SUBMITTED udah diset di schema, ga perlu ditulis manual
      },
      include: { category: true },
    });

    // Catet status awal ke StatusLog juga, biar timeline-nya konsisten
    // dari tiket pertama kali dibuat (dipake nanti di fase Status Tracker)
    await this.prisma.statusLog.create({
      data: {
        ticketId: ticket.id,
        statusLama: 'SUBMITTED',
        statusBaru: 'SUBMITTED',
      },
    });

    return ticket;
  }
}
