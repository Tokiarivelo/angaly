import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IMeasurementProfileRepository } from '../../domain/repositories/measurement-profile.repository';

@Injectable()
export class DeleteMeasurementProfileUseCase {
  constructor(
    @Inject('IMeasurementProfileRepository')
    private readonly repository: IMeasurementProfileRepository,
  ) {}

  async execute(id: string, customerId: string): Promise<void> {
    const profile = await this.repository.findById(id);
    if (!profile) {
      throw new NotFoundException(`Measurement profile ${id} not found`);
    }
    if (profile.customerId !== customerId) {
      throw new ForbiddenException(`Access denied to profile ${id}`);
    }

    await this.repository.delete(id);
  }
}
