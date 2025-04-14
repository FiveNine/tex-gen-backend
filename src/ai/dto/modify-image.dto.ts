import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class ModifyImageDto {
  @ApiProperty({
    description: 'The job ID of the generation job to modify',
    example: 'cl1234567890',
  })
  @IsString()
  jobId: string;

  @ApiProperty({
    description: 'The URL of the image to modify',
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  imageUrl: string;

  @ApiProperty({
    description: 'The prompt describing how to modify the texture',
    example: 'Make the stone wall more weathered and add more moss',
  })
  @IsString()
  prompt: string;

  @ApiProperty({
    description: 'Optional array of reference images',
    type: 'array',
    items: { type: 'string', format: 'binary' },
    required: false,
  })
  @IsOptional()
  @Type(() => Array)
  referenceImages?: Express.Multer.File[];
}
