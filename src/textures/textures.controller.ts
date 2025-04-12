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
} from '@nestjs/swagger';
import {
  TextureResponseDto,
  PaginatedTexturesResponseDto,
  UploadUrlResponseDto,
} from './dto/textures-response.dto';

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
  @ApiOperation({ summary: 'Get all textures' })
  @ApiResponse({
    status: 200,
    description: 'List of textures retrieved successfully',
    type: PaginatedTexturesResponseDto,
  })
  async findAll(
    @Req() req: RequestWithUser,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedTexturesResponseDto> {
    return this.texturesService.findAll(
      req.user.id,
      cursor,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search textures' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    type: PaginatedTexturesResponseDto,
  })
  async search(
    @Req() req: RequestWithUser,
    @Query('q') query: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedTexturesResponseDto> {
    return this.texturesService.search(
      req.user.id,
      query,
      cursor,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a texture by ID' })
  @ApiResponse({
    status: 200,
    description: 'Texture retrieved successfully',
    type: TextureResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Texture not found' })
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<TextureResponseDto> {
    return this.texturesService.findOne(id, req.user.id);
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
  @ApiResponse({
    status: 200,
    description: 'Texture deleted successfully',
    type: TextureResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Texture not found' })
  async delete(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<TextureResponseDto> {
    return this.texturesService.delete(id, req.user.id);
  }

  @Get('upload-url')
  @ApiOperation({ summary: 'Get a presigned URL for uploading a texture' })
  @ApiResponse({
    status: 200,
    description: 'Upload URL generated successfully',
    type: UploadUrlResponseDto,
  })
  async getUploadUrl(): Promise<UploadUrlResponseDto> {
    return this.texturesService.getUploadUrl();
  }
}
