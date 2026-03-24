import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConsentDto {
  @ApiProperty({
    enum: ['inbound_form', 'demo_request', 'web_callback', 'written_consent', 'verbal_consent'],
    example: 'written_consent',
  })
  @IsEnum(['inbound_form', 'demo_request', 'web_callback', 'written_consent', 'verbal_consent'])
  consentType: 'inbound_form' | 'demo_request' | 'web_callback' | 'written_consent' | 'verbal_consent';

  @ApiProperty({
    enum: ['email_only', 'call_only', 'ai_call', 'all_channels'],
    example: 'ai_call',
  })
  @IsEnum(['email_only', 'call_only', 'ai_call', 'all_channels'])
  consentScope: 'email_only' | 'call_only' | 'ai_call' | 'all_channels';

  @ApiPropertyOptional({ example: 'Contact form on website' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  consentSource?: string;

  @ApiPropertyOptional({ example: 'https://screenshot.example.com/consent.png' })
  @IsOptional()
  @IsUrl()
  consentProofUrl?: string;

  @ApiPropertyOptional({
    example: 'I agree to receive AI-assisted calls from CompanyX',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  consentText?: string;

  @ApiPropertyOptional({ example: 'CompanyX Inc.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  consentedToCompany?: string;
}

export class RevokeConsentDto {
  @ApiPropertyOptional({ example: 'verbal_request' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  revocationMethod?: string;
}