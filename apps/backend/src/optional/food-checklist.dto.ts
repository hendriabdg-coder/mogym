import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class FoodItemDto {
  @IsOptional() @IsString() id?: string;
  @IsString() name!: string;
  @IsBoolean() consumed!: boolean;
}
export class SaveFoodChecklistDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => FoodItemDto)
  items!: FoodItemDto[];
}
export class ToggleFoodItemDto { @IsBoolean() consumed!: boolean; }
