import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ example: 'Ana' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'Martinez Lopez' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ example: '001-1234567-8', description: 'National ID / cedula / DNI' })
  @IsString()
  @MinLength(5)
  documentId: string;

  @ApiPropertyOptional({ example: 'ana.martinez@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '809-555-0102' })
  @IsString()
  @MinLength(7)
  phone: string;

  @ApiPropertyOptional({ example: 'Calle Duarte #45, Santo Domingo' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Comerciante' })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional({ example: 35000, description: 'Estimated monthly income' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyIncome?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
