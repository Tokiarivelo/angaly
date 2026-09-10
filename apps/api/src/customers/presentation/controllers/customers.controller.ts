import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import type { AccessTokenPayload } from '../../../auth/domain/services/access-token.service';
import { CustomerResponseDto } from '../../application/dtos/customer-response.dto';
import { UpdateCustomerProfileDto } from '../../application/dtos/update-customer-profile.dto';
import { GetCustomerProfileUseCase } from '../../application/use-cases/get-customer-profile.use-case';
import { UpdateCustomerProfileUseCase } from '../../application/use-cases/update-customer-profile.use-case';
import { CustomerEntity } from '../../domain/entities/customer.entity';

function toResponse(customer: CustomerEntity): CustomerResponseDto {
  const response = new CustomerResponseDto();
  response.id = customer.id;
  response.userId = customer.userId;
  response.firstName = customer.firstName;
  response.lastName = customer.lastName;
  response.phone = customer.phone;
  response.createdAt = customer.createdAt.toISOString();
  response.updatedAt = customer.updatedAt.toISOString();
  return response;
}

@ApiTags('Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(
    private readonly getCustomerProfileUseCase: GetCustomerProfileUseCase,
    private readonly updateCustomerProfileUseCase: UpdateCustomerProfileUseCase,
  ) {}

  @Get('me')
  @ApiOperation({ summary: "Get the current user's Customer profile" })
  @ApiResponse({ status: 200, type: CustomerResponseDto })
  async getMe(@CurrentUser() user: AccessTokenPayload): Promise<CustomerResponseDto> {
    const customer = await this.getCustomerProfileUseCase.execute(user.sub);
    return toResponse(customer);
  }

  @Patch('me')
  @ApiOperation({ summary: "Update the current user's Customer profile" })
  @ApiResponse({ status: 200, type: CustomerResponseDto })
  async updateMe(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: UpdateCustomerProfileDto,
  ): Promise<CustomerResponseDto> {
    const customer = await this.updateCustomerProfileUseCase.execute(user.sub, dto);
    return toResponse(customer);
  }
}
