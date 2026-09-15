import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { MeasurementModelPreference } from '../../domain/entities/ai-model-setting.entity';

export class UpdateAiModelSettingDto {
  @ApiProperty({ enum: ['GEMINI', 'LOCAL_STATISTICAL'] })
  @IsIn(['GEMINI', 'LOCAL_STATISTICAL'])
  measurementModel!: MeasurementModelPreference;
}
