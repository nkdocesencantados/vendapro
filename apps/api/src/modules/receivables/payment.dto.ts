import { IsNumber, IsPositive, IsIn } from 'class-validator';

export class PaymentDto {
  @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive()
  amount: number;

  @IsIn(['pix', 'cash', 'credit_card', 'debit_card'])
  method: 'pix' | 'cash' | 'credit_card' | 'debit_card';
}
