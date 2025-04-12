import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
  Body,
} from '@nestjs/common';
import { TexturesService } from './textures.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  TextureResponseDto,
  PaginatedTexturesResponseDto,
  UploadUrlResponseDto,
} from './dto/textures-response.dto';
import { User } from '../auth/decorators/user.decorator';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('Textures')
@Controller('textures')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TexturesController {
  constructor(private readonly texturesService: TexturesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all textures for the authenticated user' })
  @ApiResponse({ type: PaginatedTexturesResponseDto })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @User('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ): Promise<PaginatedTexturesResponseDto> {
    return this.texturesService.findAll(userId, cursor, limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search textures by name or tags' })
  @ApiResponse({ type: PaginatedTexturesResponseDto })
  @ApiQuery({ name: 'query', required: true })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async search(
    @User('id') userId: string,
    @Query('query') query: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ): Promise<PaginatedTexturesResponseDto> {
    return this.texturesService.search(userId, query, cursor, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific texture by ID' })
  @ApiResponse({ type: TextureResponseDto })
  @ApiResponse({ status: 404, description: 'Texture not found' })
  async findOne(
    @Param('id') id: string,
    @User('id') userId: string,
  ): Promise<TextureResponseDto> {
    return this.texturesService.findOne(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new texture' })
  @ApiResponse({
    status: 201,
    description: 'Texture created successfully',
    type: TextureResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(
    @Req() req: RequestWithUser,
    @Body()
    data: {
      name: string;
      slug: string;
      tags: string[];
      s3Key: string;
      resolution: string;
    },
  ): Promise<TextureResponseDto> {
    return this.texturesService.create(req.user.id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a texture' })
  @ApiResponse({ type: TextureResponseDto })
  @ApiResponse({ status: 404, description: 'Texture not found' })
  async delete(
    @Param('id') id: string,
    @User('id') userId: string,
  ): Promise<TextureResponseDto> {
    return this.texturesService.delete(id, userId);
  }

  @Get('upload-url')
  @ApiOperation({
    summary: 'Get a pre-signed URL for uploading a texture to S3',
  })
  @ApiResponse({ type: UploadUrlResponseDto })
  async getUploadUrl(): Promise<UploadUrlResponseDto> {
    return this.texturesService.getUploadUrl();
  }
}
