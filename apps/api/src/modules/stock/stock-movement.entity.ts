import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum MovementType {
  IN = 'in',
  OUT = 'out',
  ADJUST = 'adjust',
  SALE = 'sale',
  RETURN = 'return',
}

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: MovementType })
  type: MovementType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int' })
  stockBefore: number;

  @Column({ type: 'int' })
  stockAfter: number;

  @Column({ nullable: true })
  reason: string;

  @Column({ nullable: true })
  referenceId: string;

  @Column()
  productId: string;

  @Column({ nullable: true })
  userId: string;

  @Column()
  storeId: string;

  @CreateDateColumn()
  createdAt: Date;
}
