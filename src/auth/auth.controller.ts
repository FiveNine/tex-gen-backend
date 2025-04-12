import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
  AuthResponseDto,
  TokenResponseDto,
  UserResponseDto,
} from './dto/auth-response.dto';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, name, password } = registerDto;
    return this.authService.register(email, name, password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;
    return this.authService.login(email, password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({
    schema: {
      properties: {
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token successfully refreshed',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async refresh(
    @Body('refreshToken') refreshToken: string,
  ): Promise<TokenResponseDto> {
    return this.authService.refreshToken(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({
    status: 200,
    description: 'Current user details',
    type: UserResponseDto,
  })
  async me(@Req() req: RequestWithUser): Promise<UserResponseDto> {
    return this.authService.getUser(req.user.id);
  }
}
