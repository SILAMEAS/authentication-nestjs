import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'sok' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'email@gmail.com' })
  @IsEmail()
  email!: string;
  @ApiProperty({ example: '#password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
