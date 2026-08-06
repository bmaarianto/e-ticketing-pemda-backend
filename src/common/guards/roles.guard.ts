import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

// PENTING: guard ini harus dipasang SETELAH JwtAuthGuard (urutan array @UseGuards berpengaruh),
// soalnya dia butuh req.user yang cuma keisi kalau JwtAuthGuard udah jalan duluan.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Kalau endpoint ga ditandain @Roles() sama sekali, berarti semua role yang
    // udah login boleh akses — cukup lolos JwtAuthGuard aja
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const allowed = requiredRoles.includes(user?.role);

    if (!allowed) {
      throw new ForbiddenException(
        `Role ${user?.role} tidak punya akses ke endpoint ini`,
      );
    }

    return true;
  }
}
