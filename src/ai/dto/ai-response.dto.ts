import { ApiProperty } from '@nestjs/swagger';

export class JobStatusResponseDto {
  @ApiProperty({
    description: 'Job status',
    example: 'completed',
    enum: ['pending', 'processing', 'completed', 'failed'],
  })
  status: string;

  @ApiProperty({
    description: 'Job progress percentage',
    example: 100,
  })
  progress: number;
}

export class TextureResponseDto {
  @ApiProperty({
    description: 'Texture ID',
    example: 'cl1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Texture name',
    example: 'Blue Marble Wall',
  })
  name: string;

  @ApiProperty({
    description: 'Texture slug',
    example: 'blue-marble-wall',
  })
  slug: string;

  @ApiProperty({
    description: 'S3 key for the texture',
    example: 'textures/1234567890.png',
  })
  s3Key: string;

  @ApiProperty({
    description: 'Texture resolution',
    example: '1024x1024',
  })
  resolution: string;
}

export class JobResultsResponseDto {
  @ApiProperty({
    description: 'List of generated textures',
    type: [TextureResponseDto],
  })
  textures: TextureResponseDto[];
}

export class JobResponseDto {
  @ApiProperty({
    description: 'Job ID',
    example: 'job-1234567890',
  })
  jobId: string;

  @ApiProperty({
    description: 'Job status',
    example: 'pending',
    enum: ['pending', 'processing', 'completed', 'failed'],
  })
  status: string;
}
