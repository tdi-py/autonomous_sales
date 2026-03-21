import { IsString, IsOptional, IsEmail, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'My Agency' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'billing@myagency.com' })
  @IsOptional()
  @IsEmail()
  billingEmail?: string;
}

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({ example: 'My Agency (Updated)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  billingEmail?: string;
}

export class InviteMemberDto {
  @ApiProperty({ example: 'teammate@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'member', enum: ['admin', 'member', 'viewer'] })
  @IsOptional()
  @IsString()
  role?: 'admin' | 'member' | 'viewer';
}