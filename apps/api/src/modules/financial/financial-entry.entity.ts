import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum EntryType { INCOME = 'income', EXPENSE = 'expense' }
export enum EntryCategory {
  SALE = 'sale', RENT = 'rent', SALARY = 'salary',
  SUPPLIER = 'supplier', TAX = 'tax', OTHER = 'other',
}

@Entity('financial_entries')
export class FinancialEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: EntryType })
  type: EntryType;

  @Column({ type: 'enum', enum: EntryCategory, default: EntryCategory.OTHER })
  category: EntryCategory;

  @Column({ length: 200 })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ nullable: true })
  referenceId: string;

  @Column()
  storeId: string;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;
}
