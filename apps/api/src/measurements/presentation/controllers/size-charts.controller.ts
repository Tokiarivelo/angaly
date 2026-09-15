import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { SizeChartGender } from '@angaly/types';
import { GetSizeChartsUseCase } from '../../application/use-cases/get-size-charts.use-case';

class GetSizeChartsQueryDto {
  @IsOptional()
  @IsIn(['FEMME', 'HOMME'])
  gender?: SizeChartGender;
}

@ApiTags('Size Charts')
@Controller('measurements/size-charts')
export class SizeChartsController {
  constructor(private readonly getSizeChartsUseCase: GetSizeChartsUseCase) {}

  @ApiOperation({ summary: 'Get standard size charts (XS/S/M/L/XL…) for Pattern Studio' })
  @ApiQuery({ name: 'gender', required: false, enum: ['FEMME', 'HOMME'] })
  @Get()
  get(@Query() query: GetSizeChartsQueryDto) {
    return this.getSizeChartsUseCase.execute(query.gender);
  }
}
