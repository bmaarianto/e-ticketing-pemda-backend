import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Dipake di controller biar ga nulis @Req() req lalu req.user berulang-ulang.
// Contoh: getMe(@CurrentUser() user: AuthUser) { return user; }
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export type AuthUser = {
  id: number;
  email: string;
  nama: string;
  role: 'ADMIN' | 'TEKNISI' | 'USER_DINAS';
};
