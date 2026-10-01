import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AssignCreationProjectDto {
  /** `null` retire l'assignation. */
  @ApiPropertyOptional({ nullable: true, type: String, description: 'Staff user id, or null to unassign' })
  @IsOptional()
  @IsString()
  userId!: string | null;
}
