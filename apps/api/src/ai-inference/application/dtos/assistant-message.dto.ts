import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AssistantMessageDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsOptional()
  @IsString()
  patternProjectId?: string;
}
