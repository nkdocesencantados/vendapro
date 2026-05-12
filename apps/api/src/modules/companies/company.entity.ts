import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"
@Entity("companies")
export class Company {
  @PrimaryGeneratedColumn("uuid") id: string
  @Column() name: string
  @Column({ nullable:true }) email: string
  @Column({ nullable:true }) phone: string
  @Column({ nullable:true }) document: string
  @Column({ default:"basic" }) plan: string
  @Column({ default:"active" }) status: string
  @Column({ nullable:true }) ownerId: string
  @CreateDateColumn() createdAt: Date
  @UpdateDateColumn() updatedAt: Date
}
