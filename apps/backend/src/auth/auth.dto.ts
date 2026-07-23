import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString() @MinLength(2) @MaxLength(80) name!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) @MaxLength(128) password!: string;
}
export class LoginDto { @IsEmail() email!: string; @IsString() @IsNotEmpty() password!: string; }
export class RefreshDto { @IsString() @IsNotEmpty() refreshToken!: string; }
export class ForgotPasswordDto { @IsEmail() email!: string; }
export class ResetPasswordDto {
  @IsString() @IsNotEmpty() token!: string;
  @IsString() @MinLength(8) @MaxLength(128) newPassword!: string;
}
export class GoogleAuthDto { @IsString() @IsNotEmpty() idToken!: string; }
export class AppleAuthDto {
  @IsString() @IsNotEmpty() identityToken!: string;
  @IsString() @IsNotEmpty() authorizationCode!: string;
  @IsOptional() user?: unknown;
}
