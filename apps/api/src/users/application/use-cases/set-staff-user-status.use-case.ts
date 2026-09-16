import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { StaffUserEntity } from '../../domain/entities/staff-user.entity';
import {
  IStaffUserRepository,
  STAFF_USER_REPOSITORY,
} from '../../domain/repositories/staff-user.repository';

export interface SetStaffUserStatusInput {
  targetUserId: string;
  isActive: boolean;
  actorUserId: string;
}

/** Never lets an ADMIN deactivate their own account — avoids locking everyone out with no active admin left. */
@Injectable()
export class SetStaffUserStatusUseCase {
  constructor(
    @Inject(STAFF_USER_REPOSITORY) private readonly staffUserRepository: IStaffUserRepository,
  ) {}

  async execute(input: SetStaffUserStatusInput): Promise<StaffUserEntity> {
    if (input.targetUserId === input.actorUserId && !input.isActive) {
      throw new BadRequestException('An admin cannot deactivate their own account');
    }

    const target = await this.staffUserRepository.findById(input.targetUserId);
    if (!target) {
      throw new NotFoundException(`Staff user ${input.targetUserId} not found`);
    }

    return this.staffUserRepository.setActive(input.targetUserId, input.isActive);
  }
}
