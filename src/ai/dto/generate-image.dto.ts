import { ApiProperty } from '@nestjs/swagger';

export class GenerateImageDto {
  @ApiProperty({
    description: 'User prompt for image generation',
    example: 'Create a seamless wood texture',
  })
  prompt: string;

  @ApiProperty({
    description: 'Array of reference image paths',
    example: ['uploads/reference1.jpg', 'uploads/reference2.png'],
    type: [String],
    required: false,
  })
  imagePaths?: string[];
}
