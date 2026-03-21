import {
  IsString,
  IsOptional,
  IsUrl,
  IsArray,
  IsIn,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'ShopFast US Campaign' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'workspace-uuid-here' })
  @IsString()
  workspaceId: string;

  @ApiPropertyOptional({ example: 'https://shopfastapp.com' })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiPropertyOptional({ example: 'ecommerce' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({
    example: 'saas',
    enum: ['saas', 'ecommerce', 'agency', 'service', 'marketplace', 'other'],
  })
  @IsOptional()
  @IsIn(['saas', 'ecommerce', 'agency', 'service', 'marketplace', 'other'])
  businessType?: string;

  @ApiPropertyOptional({ example: ['US', 'CA'], type: [String] })
  @IsOptional()
  @IsArray()
  targetGeography?: string[];

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  defaultLanguage?: string;
}

export class UpdateProjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({
    enum: ['saas', 'ecommerce', 'agency', 'service', 'marketplace', 'other'],
  })
  @IsOptional()
  @IsIn(['saas', 'ecommerce', 'agency', 'service', 'marketplace', 'other'])
  businessType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  targetGeography?: string[];

  @ApiPropertyOptional({
    enum: ['onboarding', 'active', 'paused', 'archived'],
  })
  @IsOptional()
  @IsIn(['onboarding', 'active', 'paused', 'archived'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  defaultLanguage?: string;
}

export class CreateIcpProfileDto {
  @ApiProperty({ example: 'Mid-market SaaS CTOs' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  label: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ example: '50-200' })
  @IsOptional()
  @IsString()
  companySize?: string;

  @ApiPropertyOptional({ example: ['CTO', 'VP Engineering'], type: [String] })
  @IsOptional()
  @IsArray()
  jobTitles?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  painPoints?: string[];

  @ApiPropertyOptional({ example: 'US' })
  @IsOptional()
  @IsString()
  geography?: string;
}