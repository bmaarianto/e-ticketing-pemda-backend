import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

// Dipake di atas controller/method, misal: @Roles(Role.ADMIN, Role.TEKNISI)
// Nilainya cuma ditaro sebagai metadata — yang beneran ngecek adalah RolesGuard
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
