import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  HttpStatus,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserResponseDto } from './dto/auth-response.dto';
import { ErrorResponseDto } from './dto/error-response.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: registerDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      const user = await this.prisma.user.create({
        data: {
          email: registerDto.email,
          passwordHash: hashedPassword,
          name: registerDto.name,
        },
      });

      const { passwordHash, ...result } = user;
      return result;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to register user');
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: loginDto.email },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = { sub: user.id, email: user.email };
      return {
        access_token: await this.jwtService.signAsync(payload),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Failed to login');
    }
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const error: ErrorResponseDto = {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'User not found',
        error: 'UNAUTHORIZED',
      };
      return { error };
    }

    return this.generateTokens(user);
  }

  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const error: ErrorResponseDto = {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User not found',
        error: 'NOT_FOUND',
      };
      return { error };
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionPlan: user.subscriptionPlan,
      credits: user.credits,
    };
  }

  private generateTokens(user: { id: string; email: string }) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }

  async validateUser(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const { passwordHash, ...result } = user;
      return result;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Failed to validate user');
    }
  }
}
