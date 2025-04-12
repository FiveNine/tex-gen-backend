import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { TextureResponseDto } from './texture-response.dto';

export class PaginatedTexturesResponseDto extends PaginatedResponseDto<TextureResponseDto> {
  @ApiProperty({
    description: 'Array of textures',
    type: [TextureResponseDto],
  })
  declare items: TextureResponseDto[];
}
