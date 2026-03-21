import { IsString, IsOptional, IsIn, IsInt, Min, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Florist Cold Email — March' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'project-uuid-here' })
  @IsString()
  projectId: string;

  @ApiPropertyOptional({
    example: 'cold_email',
    enum: ['cold_email', 'cold_call', 'linkedin', 'multi_channel'],
  })
  @IsOptional()
  @IsIn(['cold_email', 'cold_call', 'linkedin', 'multi_channel'])
  type?: string;
}

export class UpdateCampaignDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ enum: ['draft', 'active', 'paused', 'completed'] })
  @IsOptional()
  @IsIn(['draft', 'active', 'paused', 'completed'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  settings?: Record<string, unknown>;
}

export class CreateEmailSequenceDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  stepOrder: number;

  @ApiProperty({ example: 'Quick question about {{company_name}} deliveries' })
  @IsString()
  @MinLength(1)
  subjectTemplate: string;

  @ApiProperty({ example: 'Hi {{first_name}}, I noticed you ship locally...' })
  @IsString()
  @MinLength(1)
  bodyTemplate: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  delayDays?: number;

  @ApiPropertyOptional({ example: 'variant_a' })
  @IsOptional()
  @IsString()
  variantLabel?: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  language?: string;
}

export class CreateCallScriptDto {
  @ApiPropertyOptional({ example: 'Hi, is this the owner of {{company_name}}?' })
  @IsOptional()
  @IsString()
  openingScript?: string;

  @ApiPropertyOptional()
  @IsOptional()
  dialogueTree?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  objectionHandlers?: unknown[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  closingScript?: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  language?: string;
}