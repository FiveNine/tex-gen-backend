import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

type DalleSize =
  | '256x256'
  | '512x512'
  | '1024x1024'
  | '1792x1024'
  | '1024x1792';

export class GenerateImageDto {
  @ApiProperty({
    description: 'The prompt describing the texture to generate',
    example: 'A rough stone wall with moss growing in the cracks',
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

  @ApiProperty({
    description: 'The size of the generated image',
    example: '1024x1024',
    enum: ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'],
    default: '1024x1024',
  })
  @IsEnum(['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'])
  @IsOptional()
  size?: DalleSize;
}
