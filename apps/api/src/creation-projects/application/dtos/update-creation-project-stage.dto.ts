import { ApiProperty } from '@nestjs/swagger';
import { CreationProjectStage } from '@angaly/types';
import { IsEnum } from 'class-validator';

export class UpdateCreationProjectStageDto {
  @ApiProperty({ enum: CreationProjectStage })
  @IsEnum(CreationProjectStage)
  stage!: CreationProjectStage;
}
