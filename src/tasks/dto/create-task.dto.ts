import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'task name' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  title: string;
  @ApiProperty({ example: 'description name', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
