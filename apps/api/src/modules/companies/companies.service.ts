import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Company } from "./company.entity"
import { User } from "../users/user.entity"
import { Store } from "../stores/store.entity"

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company) private repo: Repository<Company>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Store) private storeRepo: Repository<Store>,
  ) {}

  findAll() { return this.repo.find({ order:{ createdAt:"DESC" } }) }

  async create(data: any) {
    const company = await this.repo.save(this.repo.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      document: data.document,
      plan: data.plan || "basic",
      status: "active",
    }))

    const storeData = await this.storeRepo.query(
      `INSERT INTO stores (id, name, "companyId", "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, NOW(), NOW()) RETURNING id`,
      [data.name, company.id]
    )
    const storeId = storeData[0].id

    const user = this.userRepo.create({
      name: data.name,
      email: data.email,
      password: data.password || "VendaPro@2026!",
      role: "store_owner",
      storeId: storeId,
    })
    await this.userRepo.save(user)

    return company
  }

  async updateStatus(id: string, status: string) {
    await this.repo.update(id, { status })
    return this.repo.findOne({ where:{ id } })
  }

  findOne(id: string) { return this.repo.findOne({ where:{ id } }) }

  async resetPassword(id: string, password: string) {
    const stores = await this.repo.query(`SELECT id FROM stores WHERE "companyId" = $1`, [id])
    for (const store of stores) {
      const users = await this.userRepo.query(`SELECT id FROM users WHERE "storeId" = $1`, [store.id])
      for (const u of users) {
        const bcrypt = require("bcryptjs")
        const hashed = await bcrypt.hash(password, 12)
        await this.userRepo.query(`UPDATE users SET password = $1 WHERE id = $2`, [hashed, u.id])
      }
    }
    return { message: "Senha redefinida com sucesso" }
  }

  async updatePlan(id: string, plan: string) {
    await this.repo.update(id, { plan })
    await this.repo.query(`UPDATE stores SET plan = $1 WHERE "companyId" = $2`, [plan, id])
    return { message: "Plano atualizado com sucesso" }
  }

  async remove(id: string) {
    const stores = await this.repo.query(`SELECT id FROM stores WHERE "companyId" = $1`, [id])
    for (const s of stores) {
      await this.repo.query(`DELETE FROM users WHERE "storeId" = $1`, [s.id])
    }
    await this.repo.query(`DELETE FROM stores WHERE "companyId" = $1`, [id])
    await this.repo.delete(id)
    return { message: "Empresa excluida" }
  }
}
