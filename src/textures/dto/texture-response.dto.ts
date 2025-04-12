import { ApiProperty } from '@nestjs/swagger';

export class TextureResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the texture',
    example: 'clh2j3k4m0000qw3f5g6h7i8j',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the texture',
    example: 'Blue Marble Wall',
  })
  name: string;

  @ApiProperty({
    description: 'URL-friendly slug for the texture',
    example: 'blue-marble-wall',
  })
  slug: string;

  @ApiProperty({
    description: 'Array of tags associated with the texture',
    example: ['marble', 'wall', 'blue'],
    isArray: true,
  })
  tags: string[];

  @ApiProperty({
    description: 'S3 key for the texture image',
    example: 'textures/user123/blue-marble-wall-1234567890.png',
  })
  s3Key: string;

  @ApiProperty({
    description: 'Resolution of the texture image',
    example: '1024x1024',
  })
  resolution: string;

  @ApiProperty({
    description: 'ID of the user who created the texture',
    example: 'user123',
  })
  userId: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-03-15T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-03-15T12:00:00.000Z',
  })
  updatedAt: Date;
}
