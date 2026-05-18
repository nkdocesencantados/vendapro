import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate, Index } from 'typeorm';
import * as bcrypt from 'bcryptjs';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  STORE_OWNER = 'store_owner',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 150 })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'varchar', default: 'store_owner' })
  role: string;

  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  storeId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, nullable: true })
  commissionRate: number;

  @Column({ nullable: true, type: 'timestamp' })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}