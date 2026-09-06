import { ApiProperty } from '@nestjs/swagger';

export class SearchResultDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  excerpt!: string;

  @ApiProperty({ nullable: true })
  imageUrl!: string | null;
}

export class SearchResultsResponseDto {
  @ApiProperty({ type: [SearchResultDto] })
  creations!: SearchResultDto[];

  @ApiProperty({ type: [SearchResultDto] })
  products!: SearchResultDto[];

  @ApiProperty({ type: [SearchResultDto] })
  collections!: SearchResultDto[];

  @ApiProperty({ type: [SearchResultDto] })
  blogPosts!: SearchResultDto[];

  @ApiProperty({ type: [SearchResultDto] })
  ateliers!: SearchResultDto[];
}
