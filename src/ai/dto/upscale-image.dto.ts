import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum } from 'class-validator';

export type UpscaleSize = '1024x1024' | '2048x2048';

export class UpscaleImageDto {
  @ApiProperty({
    description: 'The job ID of the generation job to upscale',
    example: 'cl1234567890',
  })
  @IsString()
  jobId: string;

  @ApiProperty({
    description: 'The URL of the image to upscale',
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  imageUrl: string;

  @ApiProperty({
    description: 'The target resolution for upscaling',
    example: '1024x1024',
    enum: ['1024x1024', '2048x2048'],
  })
  @IsEnum(['1024x1024', '2048x2048'])
  size: UpscaleSize;
}
