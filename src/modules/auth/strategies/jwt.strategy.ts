import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

// Strategy ini yang dipanggil passport tiap ada request ke endpoint yang diproteksi JwtAuthGuard.
// Alurnya: ambil token dari header Authorization -> verifikasi tanda tangannya pake JWT_SECRET
// -> kalau valid, method validate() dipanggil dengan isi payload token.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') as string,
    });
  }

  async validate(payload: { sub: number; email: string; role: string }) {
    // Kita sengaja query ulang ke database di sini (bukan langsung percaya payload token).
    // Alasannya: kalau user dihapus atau role-nya diganti admin setelah token diterbitkan,
    // perubahan itu langsung kedetect di request berikutnya, ga nunggu token expired dulu.
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    // Apapun yang di-return di sini bakal nempel jadi req.user
    return { id: user.id, email: user.email, role: user.role, nama: user.nama };
  }
}
