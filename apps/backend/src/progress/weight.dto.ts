import { IsDateString, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class LogWeightDto {
  @IsNumber() @Min(30) @Max(350) weightKg!: number;
  @IsOptional() @IsNumber() @Min(2) @Max(70) bodyFatPercent?: number;
  @IsDateString() date!: string;
  @IsOptional() @IsString() notes?: string;
}
