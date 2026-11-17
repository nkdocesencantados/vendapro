import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  storeId: string;

  @Column({ length: 150 })
  name: string;

  @Column({ nullable: true, length: 30 })
  phone: string;

  @Column({ nullable: true, length: 150 })
  email: string;

  @Column({ nullable: true, length: 20 })
  document: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
