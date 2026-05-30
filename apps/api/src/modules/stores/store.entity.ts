import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum StoreStatus { ACTIVE = 'active', INACTIVE = 'inactive', TRIAL = 'trial' }
export enum StorePlan { STARTER = 'starter', PRO = 'pro', BUSINESS = 'business' }

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ nullable: true })
  cnpj: string;

  @Column({ nullable: true })
  segment: string;

  @Column({ type: 'enum', enum: StoreStatus, default: StoreStatus.TRIAL })
  status: StoreStatus;

  @Column({ type: 'enum', enum: StorePlan, default: StorePlan.STARTER })
  plan: StorePlan;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  monthlyGoal: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 26.30 })
  profitMargin: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  margin: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15.00 })
  defaultCommissionRate: number;

  @Column({ default: '#0F6E56' })
  primaryColor: string;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
