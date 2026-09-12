import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaMeasurementProfileRepository } from './infrastructure/repositories/prisma-measurement-profile.repository';
import { CreateMeasurementProfileUseCase } from './application/use-cases/create-measurement-profile.use-case';
import { UpdateMeasurementProfileUseCase } from './application/use-cases/update-measurement-profile.use-case';
import { DuplicateMeasurementProfileUseCase } from './application/use-cases/duplicate-measurement-profile.use-case';
import { DeleteMeasurementProfileUseCase } from './application/use-cases/delete-measurement-profile.use-case';
import { ListMeasurementProfilesUseCase } from './application/use-cases/list-measurement-profiles.use-case';
import { GetMeasurementProfileUseCase } from './application/use-cases/get-measurement-profile.use-case';
import { MeasurementProfilesController } from './presentation/controllers/measurement-profiles.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MeasurementProfilesController],
  providers: [
    {
      provide: 'IMeasurementProfileRepository',
      useClass: PrismaMeasurementProfileRepository,
    },
    CreateMeasurementProfileUseCase,
    UpdateMeasurementProfileUseCase,
    DuplicateMeasurementProfileUseCase,
    DeleteMeasurementProfileUseCase,
    ListMeasurementProfilesUseCase,
    GetMeasurementProfileUseCase,
  ],
  exports: [GetMeasurementProfileUseCase],
})
export class MeasurementsModule {}
