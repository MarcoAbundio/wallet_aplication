import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/enums/role.enum';

class AuthUserDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  email!: string;
  @ApiProperty({ enum: Role })
  role!: Role;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;
  @ApiProperty()
  refreshToken!: string;
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
