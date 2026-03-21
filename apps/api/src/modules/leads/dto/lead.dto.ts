import {
  IsString,
  IsOptional,
  IsEmail,
  IsUrl,
  IsIn,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeadDto {
  @ApiProperty({ example: 'project-uuid-here' })
  @IsString()
  projectId: string;

  @ApiPropertyOptional({ example: 'Bloom & Co Florists' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @ApiPropertyOptional({ example: 'Sarah Johnson' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactName?: string;

  @ApiPropertyOptional({ example: 'sarah@bloomco.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+1-555-867-5309' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'Owner' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactTitle?: string;

  @ApiPropertyOptional({ example: 'https://bloomco.com' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @ApiPropertyOptional({
    enum: ['manual', 'scraped', 'apollo', 'google_maps', 'csv_import'],
  })
  @IsOptional()
  @IsIn(['manual', 'scraped', 'apollo', 'google_maps', 'csv_import'])
  source?: string;

  @ApiPropertyOptional({ example: 'google_maps_scraper_v1' })
  @IsOptional()
  @IsString()
  sourceDetail?: string;

  @ApiPropertyOptional({ example: 'icp-profile-uuid' })
  @IsOptional()
  @IsString()
  icpProfileId?: string;
}

export class UpdateLeadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string;

  @ApiPropertyOptional({
    enum: ['new', 'contacted', 'responded', 'qualified', 'converted', 'lost'],
  })
  @IsOptional()
  @IsIn(['new', 'contacted', 'responded', 'qualified', 'converted', 'lost'])
  status?: string;

  @ApiPropertyOptional({ example: 85 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;
}

export class LeadQueryDto {
  @ApiProperty({ example: 'project-uuid-here' })
  @IsString()
  projectId: string;

  @ApiPropertyOptional({ enum: ['new', 'contacted', 'responded', 'qualified', 'converted', 'lost'] })
  @IsOptional()
  @IsIn(['new', 'contacted', 'responded', 'qualified', 'converted', 'lost'])
  status?: string;

  @ApiPropertyOptional({ enum: ['can_call_ai', 'can_call_manual', 'cannot_call'] })
  @IsOptional()
  @IsIn(['can_call_ai', 'can_call_manual', 'cannot_call'])
  phoneClassification?: string;

  @ApiPropertyOptional({ example: 'icp-profile-uuid' })
  @IsOptional()
  @IsString()
  icpProfileId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}