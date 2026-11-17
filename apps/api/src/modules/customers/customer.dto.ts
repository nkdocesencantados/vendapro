import { IsString, IsNotEmpty, IsOptional, IsEmail, MaxLength, ValidateIf } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateCustomerDto {
  @IsString() @IsNotEmpty() @MaxLength(150)
  name: string;

  @IsOptional() @IsString() @MaxLength(30)
  phone?: string;

  // aceita "" para limpar o campo
  @IsOptional() @ValidateIf((o) => o.email !== '') @IsEmail() @MaxLength(150)
  email?: string;

  @IsOptional() @IsString() @MaxLength(20)
  document?: string;

  @IsOptional() @IsString()
  notes?: string;
}

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
