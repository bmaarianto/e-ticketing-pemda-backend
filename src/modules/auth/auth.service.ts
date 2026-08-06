import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email sudah terdaftar');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        nama: dto.nama,
        email: dto.email,
        passwordHash,
        // Default USER_DINAS kalau ga dikirim — lihat catatan di RegisterDto
        role: dto.role ?? Role.USER_DINAS,
        dinasId: dto.dinasId,
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Sengaja pakai pesan error yang sama buat email-tidak-ada maupun password-salah,
    // biar orang luar ga bisa nebak-nebak email mana yang valid di sistem (enumeration attack)
    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: {
    id: number;
    nama: string;
    email: string;
    role: Role;
    dinasId: number | null;
  }) {
    // Payload JWT sengaja minimal: sub (id) dan role.
    // Role ditaro di token supaya guard di request berikutnya bisa langsung
    // baca role tanpa query ulang ke database tiap request.
    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        dinasId: user.dinasId,
      },
    };
  }
}
