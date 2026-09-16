import { Inject, Injectable } from '@nestjs/common';

import {
  IStaffUserRepository,
  STAFF_USER_REPOSITORY,
  StaffUserListFilter,
  StaffUserListResult,
} from '../../domain/repositories/staff-user.repository';

@Injectable()
export class ListStaffUsersUseCase {
  constructor(
    @Inject(STAFF_USER_REPOSITORY) private readonly staffUserRepository: IStaffUserRepository,
  ) {}

  execute(filter: StaffUserListFilter): Promise<StaffUserListResult> {
    return this.staffUserRepository.list(filter);
  }
}
