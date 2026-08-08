import { IsInt, IsNotEmpty, MinLength } from 'class-validator';
import { Type as TransformType } from 'class-transformer';

// Dipakai buat validasi body request POST /tickets.
// Field dikirim sebagai multipart/form-data (karena ada file lampiran),
// jadi categoryId perlu di-transform manual dari string ke number.
export class CreateTicketDto {
  @TransformType(() => Number)
  @IsInt({ message: 'Kategori tidak valid' })
  categoryId: number;

  @IsNotEmpty({ message: 'Judul wajib diisi' })
  @MinLength(5, { message: 'Judul minimal 5 karakter' })
  judul: string;

  @IsNotEmpty({ message: 'Deskripsi wajib diisi' })
  @MinLength(10, { message: 'Deskripsi minimal 10 karakter, jelasin kendalanya lebih detail' })
  deskripsi: string;
}
