import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(username: string, password: string, role: string = 'user') {
    if (!username || !password) {
      throw new BadRequestException('Username and password are required');
    }
    const existing = await this.usersService.findByUsername(username);
    if (existing) {
      throw new ConflictException('Username already taken');
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = await this.usersService.create(username, passwordHash, role);

    const token = this.generateToken(user._id.toString(), user.username, user.role);
    return {
      accessToken: token,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
      },
    };
  }

  async login(username: string, password: string) {
    if (!username || !password) {
      throw new BadRequestException('Username and password are required');
    }
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const token = this.generateToken(user._id.toString(), user.username, user.role);
    return {
      accessToken: token,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
      },
    };
  }

  generateToken(userId: string, username: string, role: string): string {
    const payload = { sub: userId, username, role };
    return this.jwtService.sign(payload);
  }

  verifyToken(token: string): any {
    return this.jwtService.verify(token);
  }
}
