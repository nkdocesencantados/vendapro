import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  saleId: string;

  @Column({ nullable: true })
  productId: string;

  @Column({ length: 200, nullable: true })
  productName: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ default: false })
  isManual: boolean;

  @Column({ nullable: true, type: 'text' })
  manualDescription: string;
}