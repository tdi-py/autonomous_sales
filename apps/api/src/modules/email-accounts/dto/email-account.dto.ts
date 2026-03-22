import {
  IsString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmailAccountDto {
  @ApiProperty({ description: 'Project UUID' })
  @IsUUID()
  projectId!: string;

  @ApiProperty({ example: 'sales@company.com' })
  @IsEmail()
  emailAddress!: string;

  @ApiProperty({ enum: ['gmail', 'outlook', 'custom_smtp'] })
  @IsEnum(['gmail', 'outlook', 'custom_smtp'])
  provider!: 'gmail' | 'outlook' | 'custom_smtp';

  @ApiPropertyOptional({ example: 'smtp.gmail.com' })
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiPropertyOptional({ example: 587 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort?: number;

  @ApiPropertyOptional({ example: 'imap.gmail.com' })
  @IsOptional()
  @IsString()
  imapHost?: string;

  @ApiPropertyOptional({ example: 993 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  imapPort?: number;

  @ApiPropertyOptional({ example: 'sales@company.com' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ example: 'app-specific-password', description: 'Gmail App Password or SMTP password' })
  @IsString()
  password!: string;

  @ApiPropertyOptional({ example: 'Sales Team' })
  @IsOptional()
  @IsString()
  senderName?: string;
}

export class TestConnectionDto {
  @ApiPropertyOptional({ example: 'smtp.gmail.com' })
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiPropertyOptional({ example: 587 })
  @IsOptional()
  @IsInt()
  smtpPort?: number;

  @ApiPropertyOptional({ example: 'imap.gmail.com' })
  @IsOptional()
  @IsString()
  imapHost?: string;

  @ApiPropertyOptional({ example: 993 })
  @IsOptional()
  @IsInt()
  imapPort?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty()
  @IsString()
  password!: string;
}
