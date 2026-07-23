import { IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
class SetDto {
  @IsInt() @Min(1) setNumber!:number;
  @IsNumber() @Min(0) weightKg!:number;
  @IsInt() @Min(0) reps!:number;
  completed!:boolean;
}
class ExerciseLogDto {
  @IsString() exerciseId!:string;
  @IsArray() @ValidateNested({each:true}) @Type(()=>SetDto) sets!:SetDto[];
  @IsOptional() @IsNumber() @Min(1) @Max(10) rpe?:number;
  @IsOptional() @IsString() notes?:string;
}
export class LogSessionDto {
  @IsArray() @ValidateNested({each:true}) @Type(()=>ExerciseLogDto) exercises!:ExerciseLogDto[];
  @IsInt() @Min(1) durationMinutes!:number;
  @IsOptional() @IsNumber() @Min(1) @Max(10) averageRpe?:number;
  @IsOptional() @IsString() notes?:string;
}
export class MissSessionDto { @IsOptional() @IsString() reason?:string; }
export enum RescheduleOption { NEXT_EMPTY='next_empty',SWAP_REST='swap_rest',SKIP='skip',REBUILD_WEEK='rebuild_week' }
export class RescheduleDto {
  @IsEnum(RescheduleOption) option!:RescheduleOption;
  @IsOptional() @IsDateString() targetDate?:string;
}
