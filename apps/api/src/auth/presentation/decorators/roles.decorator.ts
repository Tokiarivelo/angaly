import { SetMetadata } from '@nestjs/common';

import type { UserRole } from '../../domain/entities/user.entity';

export const ROLES_KEY = 'roles';

/** Pairs with RolesGuard — apply after JwtAuthGuard so req.user is already populated. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
