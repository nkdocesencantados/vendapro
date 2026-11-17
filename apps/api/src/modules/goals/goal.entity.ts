import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity('goals')
@Unique('UQ_goals_store_month', ['storeId', 'month'])
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  storeId: string;

  @Column({ length: 7 })
  month: string; // YYYY-MM

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  target: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
