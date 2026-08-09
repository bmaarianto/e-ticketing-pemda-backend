import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';

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

  // Logic intinya di sini: USER_DINAS cuma boleh liat tiket yang dia ajuin sendiri
  // (where userId: user.id). TEKNISI & ADMIN liat semua tiket tanpa filter userId,
  // soalnya mereka butuh liat antrian buat kerjaannya, bukan cuma tiket sendiri.
  async findAll(user: AuthUser) {
    const isStaff = user.role === 'ADMIN' || user.role === 'TEKNISI';

    return this.prisma.ticket.findMany({
      where: isStaff ? {} : { userId: user.id },
      include: {
        category: true,
        // Staff perlu tau siapa yang ngajuin; user dinas ga perlu (tiketnya sendiri)
        user: isStaff ? { select: { id: true, nama: true, dinasId: true } } : false,
        teknisi: { select: { id: true, nama: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Dipake bareng oleh findOne() dan addComment() — dua-duanya butuh cek yang sama:
  // tiket beneran ada, dan yang akses berhak liat/berinteraksi sama tiket ini.
  private async assertTicketAccess(id: number, user: AuthUser) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });

    if (!ticket) {
      throw new NotFoundException('Tiket tidak ditemukan');
    }

    const isStaff = user.role === 'ADMIN' || user.role === 'TEKNISI';
    const isOwner = ticket.userId === user.id;

    // Sengaja pakai ForbiddenException (403), bukan diem-diem balikin null/404,
    // biar jelas bedanya antara "tiket emang ga ada" vs "tiket ada tapi bukan punya kamu"
    if (!isStaff && !isOwner) {
      throw new ForbiddenException('Kamu tidak punya akses ke tiket ini');
    }

    return ticket;
  }

  // Beda dari findAll, di sini kita ambil SATU tiket spesifik by ID, jadi harus
  // ekstra hati-hati soal otorisasi: jangan sampai user_dinas bisa liat detail
  // tiket dinas lain cuma dengan nebak-nebak angka ID di URL (/tickets/5, /tickets/6, dst).
  async findOne(id: number, user: AuthUser) {
    await this.assertTicketAccess(id, user);

    // Query kedua ini sengaja dipisah dari assertTicketAccess (yang cuma ambil
    // data tiket polos buat ngecek userId) — biar assertTicketAccess bisa dipake
    // ulang di addComment() tanpa ikut nge-load relasi berat (statusLogs, comments, dst)
    return this.prisma.ticket.findUnique({
      where: { id },
      include: {
        category: true,
        user: { select: { id: true, nama: true, dinasId: true } },
        teknisi: { select: { id: true, nama: true } },
        statusLogs: { orderBy: { changedAt: 'asc' } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, nama: true, role: true } } },
        },
      },
    });
  }

  async addComment(ticketId: number, user: AuthUser, dto: CreateCommentDto) {
    await this.assertTicketAccess(ticketId, user);

    return this.prisma.comment.create({
      data: {
        ticketId,
        userId: user.id,
        isiKomentar: dto.isiKomentar,
      },
      include: { user: { select: { id: true, nama: true, role: true } } },
    });
  }
}
