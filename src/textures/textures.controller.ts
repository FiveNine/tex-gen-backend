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

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
  };
}

@Controller('textures')
@UseGuards(JwtAuthGuard)
export class TexturesController {
  constructor(private readonly texturesService: TexturesService) {}

  @Get()
  async findAll(
    @Req() req: RequestWithUser,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.texturesService.findAll(
      req.user.id,
      cursor,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Get('search')
  async search(
    @Req() req: RequestWithUser,
    @Query('q') query: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.texturesService.search(
      req.user.id,
      query,
      cursor,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.texturesService.findOne(id, req.user.id);
  }

  @Post()
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
  ) {
    return this.texturesService.create(req.user.id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.texturesService.delete(id, req.user.id);
  }
}
