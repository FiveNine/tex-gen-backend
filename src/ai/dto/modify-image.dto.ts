import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

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
    description: 'The user ID who is modifying the texture',
    example: 'cl1234567890',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'The prompt describing how to modify the texture',
    example: 'Make the stone wall more weathered and add more moss',
  })
  @IsString()
  prompt: string;

  @ApiProperty({
    description: 'Optional array of reference image paths',
    example: ['path/to/reference1.jpg', 'path/to/reference2.jpg'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  imagePaths?: string[];
}
