import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { StaffRole, StaffUserEntity } from '../../domain/entities/staff-user.entity';
import {
  IStaffUserRepository,
  STAFF_USER_REPOSITORY,
} from '../../domain/repositories/staff-user.repository';

export interface ChangeStaffRoleInput {
  targetUserId: string;
  role: StaffRole;
  actorUserId: string;
}

/** Never lets an ADMIN change their own role — avoids accidentally locking every admin route (docs/features/users.md). */
@Injectable()
export class ChangeStaffRoleUseCase {
  constructor(
    @Inject(STAFF_USER_REPOSITORY) private readonly staffUserRepository: IStaffUserRepository,
  ) {}

  async execute(input: ChangeStaffRoleInput): Promise<StaffUserEntity> {
    if (input.targetUserId === input.actorUserId) {
      throw new BadRequestException('An admin cannot change their own role');
    }

    const target = await this.staffUserRepository.findById(input.targetUserId);
    if (!target) {
      throw new NotFoundException(`Staff user ${input.targetUserId} not found`);
    }

    return this.staffUserRepository.updateRole(input.targetUserId, input.role);
  }
}
