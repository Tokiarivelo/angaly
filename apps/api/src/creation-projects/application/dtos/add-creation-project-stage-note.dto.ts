import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CreationProjectStage } from '@angaly/types';

export class AddCreationProjectStageNoteDto {
  @ApiProperty({ enum: CreationProjectStage, example: CreationProjectStage.CONSULTATION })
  @IsEnum(CreationProjectStage)
  stage!: CreationProjectStage;

  @ApiProperty({ example: 'Cliente souhaite des manches amovibles en dentelle de Calais.' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
