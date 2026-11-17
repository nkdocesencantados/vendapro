import { IsNumber, Min } from 'class-validator';

export class SetGoalDto {
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  target: number;
}
