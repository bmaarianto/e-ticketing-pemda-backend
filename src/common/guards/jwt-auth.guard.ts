import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Tempel @UseGuards(JwtAuthGuard) di controller/route yang wajib login.
// Kalau token ga ada / invalid / expired, otomatis balikin 401 sebelum masuk ke handler.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
