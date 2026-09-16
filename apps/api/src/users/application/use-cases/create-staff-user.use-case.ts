import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { PASSWORD_HASHER, IPasswordHasher } from '../../../auth/domain/services/password-hasher';
import { StaffUserEntity, StaffRole } from '../../domain/entities/staff-user.entity';
import {
  IStaffUserRepository,
  STAFF_USER_REPOSITORY,
} from '../../domain/repositories/staff-user.repository';

export interface CreateStaffUserInput {
  email: string;
  password: string;
  role: StaffRole;
}

/**
 * Creates a staff account directly with an ADMIN-chosen initial password —
 * reuses `auth`'s `IPasswordHasher` port (never re-implements hashing), see
 * docs/features/users.md "Points d'attention" for why this is simpler than
 * the invite-by-email flow originally sketched for this module.
 */
@Injectable()
export class CreateStaffUserUseCase {
  constructor(
    @Inject(STAFF_USER_REPOSITORY) private readonly staffUserRepository: IStaffUserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: CreateStaffUserInput): Promise<StaffUserEntity> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.staffUserRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    return this.staffUserRepository.create({ email, passwordHash, role: input.role });
  }
}
