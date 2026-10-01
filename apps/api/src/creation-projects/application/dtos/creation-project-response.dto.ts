import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreationProjectStage, Role } from '@angaly/types';

export class CreationProjectAssigneeResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: 'couturiere@angaly.mg' }) email!: string;
  @ApiProperty({ enum: Role }) role!: Role;
}

export class CreationProjectStageEventResponseDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional({ enum: CreationProjectStage, nullable: true }) fromStage!: CreationProjectStage | null;
  @ApiProperty({ enum: CreationProjectStage }) toStage!: CreationProjectStage;
  @ApiPropertyOptional({ nullable: true, type: String }) changedByEmail!: string | null;
  @ApiProperty() createdAt!: string;
}

export class CreationProjectResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: 'CRP-2026-0001' }) reference!: string;
  @ApiProperty({ example: 'Robe mariage 2026' }) title!: string;
  @ApiPropertyOptional({ nullable: true, type: String }) description!: string | null;
  @ApiProperty({ enum: CreationProjectStage }) stage!: CreationProjectStage;
  @ApiPropertyOptional({ nullable: true, type: String }) quoteId!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String, example: 'ANG-DEV-2026-abc12345' }) quoteNumber!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String, example: 'Éléonore de Saint-Germain' }) customerName!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) creationId!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) completedAt!: string | null;
  @ApiPropertyOptional({ nullable: true, type: CreationProjectAssigneeResponseDto })
  assignedTo!: CreationProjectAssigneeResponseDto | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class CreationProjectDetailResponseDto extends CreationProjectResponseDto {
  @ApiProperty({ type: [CreationProjectStageEventResponseDto] })
  stageHistory!: CreationProjectStageEventResponseDto[];
}
