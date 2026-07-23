import { ActivityLevel, Gender, TargetType } from '@prisma/client';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ProfileDto {
  @IsDateString() dateOfBirth!: string;
  @IsEnum(Gender) gender!: Gender;
  @IsNumber() @Min(100) @Max(250) heightCm!: number;
  @IsNumber() @Min(30) @Max(350) weightKg!: number;
  @IsEnum(ActivityLevel) activityLevel!: ActivityLevel;
  @IsString() timezone!: string;
}

export class ProgramPreviewDto {
  @IsEnum(TargetType) targetType!: TargetType;
  @IsNumber() @Min(3) targetValue!: number;
  @IsDateString() targetDate!: string;
  @IsArray() @ArrayMinSize(2) @ArrayMaxSize(7) availableDays!: number[];
  @IsInt() @Min(30) @Max(180) sessionDurationMinutes!: number;
  @IsBoolean() hasInjury!: boolean;
  @IsOptional() @IsString() injuryNotes?: string;
  @IsOptional() @IsBoolean() progressiveOverloadEnabled = true;
  @IsOptional() @IsBoolean() weeklyWeightTargetEnabled = true;
  @IsOptional() @IsBoolean() foodChecklistEnabled = false;
  @IsOptional() @IsString() requestedPattern?: '3_4'|'4_3'|'5_2'|'6_1';
}

export class ConfirmProgramDto extends ProgramPreviewDto {
  @IsOptional() @IsString() confirmationToken?: string;
  @IsOptional() @IsBoolean() confirmAggressiveTarget?: boolean;
}
