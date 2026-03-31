import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as speakeasy from 'speakeasy';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Enable2FADto } from './dto/enable-2fa.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { User, OrgRole, OrgMember } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Пользователь с таким email уже существует');
    }

    const hashedPassword = await argon2.hash(registerDto.password);

    // Create user, organization, and membership in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: registerDto.email,
          password: hashedPassword,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          phone: registerDto.phone,
        },
      });

      // Create organization
      const orgName = registerDto.organizationName;
      const slug = this.generateSlug(orgName);

      const organization = await tx.organization.create({
        data: {
          name: orgName,
          slug,
        },
      });

      // Create membership as owner
      const membership = await tx.orgMember.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: OrgRole.OWNER,
        },
      });

      return { user, organization, membership };
    });

    const tokens = await this.generateTokens(result.user, result.membership);
    await this.saveRefreshToken(result.user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(result.user),
      organization: result.organization,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (user.twoFactorEnabled && !loginDto.twoFactorCode) {
      return {
        requiresTwoFactor: true,
        message: 'Требуется код двухфакторной аутентификации',
      };
    }

    if (user.twoFactorEnabled && loginDto.twoFactorCode) {
      const isValid = this.verify2FAToken(user.twoFactorSecret!, loginDto.twoFactorCode);
      if (!isValid) {
        throw new UnauthorizedException('Неверный код двухфакторной аутентификации');
      }
    }

    // Get user's primary organization membership
    const membership = await this.prisma.orgMember.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        organization: true,
      },
      orderBy: { joinedAt: 'asc' },
    });

    const tokens = await this.generateTokens(user, membership);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      user: this.sanitizeUser(user),
      organization: membership?.organization || null,
      ...tokens,
    };
  }

  async logout(userId: string, refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    });
    return { message: 'Выход выполнен успешно' };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    const token = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenDto.refreshToken },
      include: { user: true },
    });

    if (!token || token.expiresAt < new Date()) {
      throw new UnauthorizedException('Недействительный refresh token');
    }

    // Get user's primary organization membership
    const membership = await this.prisma.orgMember.findFirst({
      where: {
        userId: token.userId,
        isActive: true,
      },
      include: {
        organization: true,
      },
      orderBy: { joinedAt: 'asc' },
    });

    const tokens = await this.generateTokens(token.user, membership);

    await this.prisma.refreshToken.delete({
      where: { id: token.id },
    });

    await this.saveRefreshToken(token.userId, tokens.refreshToken);

    return {
      user: this.sanitizeUser(token.user),
      organization: membership?.organization || null,
      ...tokens,
    };
  }

  async enable2FA(userId: string) {
    const secret = speakeasy.generateSecret({
      name: `KAIF CRM (${userId})`,
      length: 32,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url,
    };
  }

  async verify2FA(userId: string, verify2FADto: Verify2FADto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA не настроена');
    }

    const isValid = this.verify2FAToken(user.twoFactorSecret, verify2FADto.code);

    if (!isValid) {
      throw new BadRequestException('Неверный код');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { message: 'Двухфакторная аутентификация включена' };
  }

  async disable2FA(userId: string, verify2FADto: Verify2FADto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA не настроена');
    }

    const isValid = this.verify2FAToken(user.twoFactorSecret, verify2FADto.code);

    if (!isValid) {
      throw new BadRequestException('Неверный код');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return { message: 'Двухфакторная аутентификация отключена' };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await argon2.verify(user.password, password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Аккаунт деактивирован');
    }

    return user;
  }

  async switchOrganization(userId: string, organizationId: string) {
    // Verify user is member of the organization
    const membership = await this.prisma.orgMember.findFirst({
      where: {
        userId,
        organizationId,
        isActive: true,
      },
      include: {
        organization: true,
      },
    });

    if (!membership) {
      throw new BadRequestException('Вы не являетесь участником этой организации');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    const tokens = await this.generateTokens(user, membership);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      organization: membership.organization,
      ...tokens,
    };
  }

  private async generateTokens(user: User, membership?: OrgMember | null) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: membership?.organizationId || null,
      orgRole: membership?.role || null,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async saveRefreshToken(userId: string, refreshToken: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });
  }

  private verify2FAToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    });
  }

  private sanitizeUser(user: User) {
    const { password, twoFactorSecret, ...sanitized } = user;
    return sanitized;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50)
      + '-' + Date.now().toString(36);
  }
}