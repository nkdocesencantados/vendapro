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
    // 1. Cria empresa
    const company = await this.repo.save(this.repo.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      document: data.document,
      plan: data.plan || "basic",
      status: "active",
    }))

    // 2. Cria store vinculada
    const store = await this.storeRepo.save(this.storeRepo.create({
      name: data.name,
      companyId: company.id,
    }))

    // 3. Cria usuario admin com senha
    const user = this.userRepo.create({
      name: data.name,
      email: data.email,
      password: data.password || "VendaPro@2026!",
      role: "store_owner",
      storeId: store.id,
    })
    await this.userRepo.save(user)

    return company
  }

  async updateStatus(id: string, status: string) {
    await this.repo.update(id, { status })
    return this.repo.findOne({ where:{ id } })
  }

  findOne(id: string) { return this.repo.findOne({ where:{ id } }) }
  async remove(id: string) {
    // Busca stores da empresa
    const stores = await this.storeRepo.find({ where: { companyId: id } } as any)
    for (const store of stores) {
      // Remove usuarios da store
      await this.userRepo.delete({ storeId: store.id } as any)
    }
    // Remove stores
    await this.storeRepo.delete({ companyId: id } as any)
    // Remove empresa
    await this.repo.delete(id)
    return { message: "Empresa excluida" }
  }
}