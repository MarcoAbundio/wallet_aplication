import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'Maria Gonzalez' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'maria.gonzalez@cartera.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'ClaveSegura123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: Role, example: Role.CASHIER })
  @IsEnum(Role)
  role: Role;
}
