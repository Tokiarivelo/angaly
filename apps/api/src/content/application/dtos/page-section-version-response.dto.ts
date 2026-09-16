import { ApiProperty } from '@nestjs/swagger';

export class PageSectionVersionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  pageSectionId!: string;

  @ApiProperty({ type: Object })
  snapshotJson!: Record<string, unknown>;

  @ApiProperty({ nullable: true })
  editedById!: string | null;

  @ApiProperty()
  createdAt!: string;
}
