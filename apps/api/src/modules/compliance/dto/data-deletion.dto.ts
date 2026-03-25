import {
  IsString,
  IsEmail,
  IsArray,
  IsIn,
  IsOptional,
  IsUUID,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDataDeletionRequestDto {
  @ApiProperty({ example: 'project-uuid', description: 'Project UUID' })
  @IsUUID()
  projectId: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email of the person requesting deletion (GDPR data subject)',
  })
  @IsEmail()
  requestedBy: string;

  @ApiProperty({
    enum: ['lead_deletion', 'full_erasure'],
    example: 'lead_deletion',
    description:
      'lead_deletion: anonymize specific leads. full_erasure: delete all personal data for this email.',
  })
  @IsIn(['lead_deletion', 'full_erasure'])
  requestType: 'lead_deletion' | 'full_erasure';

  @ApiPropertyOptional({
    type: [String],
    description: 'Lead UUIDs to delete (required for lead_deletion)',
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  leadIds?: string[];
}

export class ProcessDeletionRequestDto {
  @ApiPropertyOptional({ example: true, description: 'Force processing even if already completed' })
  @IsOptional()
  force?: boolean;
}