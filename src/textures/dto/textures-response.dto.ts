import { ApiProperty } from '@nestjs/swagger';

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
    description: 'Texture tags',
    example: ['marble', 'wall', 'blue'],
    type: [String],
  })
  tags: string[];

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

  @ApiProperty({
    description: 'User ID who owns the texture',
    example: 'cl1234567890',
  })
  userId: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-04-12T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-04-12T12:00:00Z',
  })
  updatedAt: Date;
}

export class PaginatedTexturesResponseDto {
  @ApiProperty({
    description: 'List of textures',
    type: [TextureResponseDto],
  })
  textures: TextureResponseDto[];

  @ApiProperty({
    description: 'Cursor for pagination',
    example: 'cl1234567890',
    required: false,
  })
  cursor?: string;

  @ApiProperty({
    description: 'Whether there are more textures to fetch',
    example: true,
  })
  hasMore: boolean;
}

export class UploadUrlResponseDto {
  @ApiProperty({
    description: 'Presigned URL for uploading',
    example: 'https://s3.amazonaws.com/bucket/key?signature=...',
  })
  url: string;

  @ApiProperty({
    description: 'S3 key for the uploaded file',
    example: 'textures/1234567890.png',
  })
  key: string;
}
