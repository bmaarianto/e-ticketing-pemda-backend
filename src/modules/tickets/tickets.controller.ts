import {
  Controller,
  Post,
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
}
