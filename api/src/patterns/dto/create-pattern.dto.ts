import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreatePatternDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @Min(5)
  @Max(200)
  width!: number;

  @IsInt()
  @Min(5)
  @Max(200)
  height!: number;

  @IsArray()
  @IsArray({ each: true })
  @ArrayMinSize(2, { each: true })
  @ArrayMaxSize(2, { each: true })
  liveCells!: [number, number][];
}
