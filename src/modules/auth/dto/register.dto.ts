import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

// Dipakai buat validasi body request POST /auth/register.
// class-validator otomatis nge-cek ini karena ValidationPipe udah diaktifin global di main.ts
export class RegisterDto {
  @IsNotEmpty({ message: 'Nama wajib diisi' })
  nama: string;

  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  // Role sengaja dibuat optional dengan default USER_DINAS di service.
  // Kita ga mau sembarang orang bisa daftar sebagai ADMIN/TEKNISI lewat form publik —
  // akun admin/teknisi idealnya dibuat manual oleh admin (lewat seed atau endpoint khusus nanti).
  @IsOptional()
  @IsEnum(Role, { message: 'Role tidak valid' })
  role?: Role;

  @IsOptional()
  @IsInt({ message: 'dinasId harus berupa angka' })
  dinasId?: number;
}
