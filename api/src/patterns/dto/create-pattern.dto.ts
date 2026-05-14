import { IsString, IsNotEmpty, IsInt, Min, Max, IsArray } from 'class-validator';

export class CreatePatternDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(5)
  @Max(200)
  width: number;

  @IsInt()
  @Min(5)
  @Max(200)
  height: number;

  @IsArray()
  liveCells: [number, number][];
}
