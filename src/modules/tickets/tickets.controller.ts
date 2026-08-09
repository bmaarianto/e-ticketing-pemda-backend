import {
  Controller,
  Post,
  Get,
  Param,
  ParseIntPipe,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

// Sengaja ga dibatesin @Roles() tertentu — walaupun kebanyakan pengaju adalah
// USER_DINAS, teknisi/admin juga boleh submit tiket buat dirinya sendiri kalau perlu.
@Controller('tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('lampiran', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          // Nama file di-random biar ga ada konflik/nimpa antar user,
          // ekstensi aslinya tetep dipertahanin
          const unique = randomUUID();
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async create(
    @Body() dto: CreateTicketDto,
    @CurrentUser() user: AuthUser,
    @UploadedFile(
      // Lampiran opsional -> fileIsRequired: false. Tapi kalau ADA file yang dikirim,
      // tetep divalidasi tipe & ukurannya.
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /(jpg|jpeg|png|pdf)$/ })
        .build({ fileIsRequired: false, errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    file?: Express.Multer.File,
  ) {
    const attachmentUrl = file ? `/uploads/${file.filename}` : undefined;
    return this.ticketsService.create(user.id, dto, attachmentUrl);
  }

  // Sengaja ga pake @Roles() di sini juga — semua role boleh akses endpoint ini,
  // tapi DATA yang dibalikin beda-beda (lihat logic-nya di ticketsService.findAll).
  // Ini pola yang lebih aman daripada bikin 2 endpoint terpisah (/tickets/mine vs /tickets/all)
  // karena filter datanya nempel ke role yang udah tervalidasi dari token, bukan dari
  // parameter yang bisa diutak-atik user di request.
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.ticketsService.findAll(user);
  }

  // ParseIntPipe otomatis nolak (400) kalau :id yang dikirim bukan angka,
  // jadi ga perlu manual cek isNaN() di service
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.ticketsService.findOne(id, user);
  }

  // Otorisasinya sama kayak findOne (cek assertTicketAccess di service) —
  // cuma pemilik tiket atau staff yang boleh nambahin komentar
  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  addComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ticketsService.addComment(id, user, dto);
  }
}
