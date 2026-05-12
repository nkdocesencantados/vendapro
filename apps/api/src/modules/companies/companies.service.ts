import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Company } from "./company.entity"
@Injectable()
export class CompaniesService {
  constructor(@InjectRepository(Company) private repo: Repository<Company>) {}
  findAll() { return this.repo.find({ order:{ createdAt:"DESC" } }) }
  create(data: Partial<Company>) { return this.repo.save(this.repo.create(data)) }
  async updateStatus(id: string, status: string) { await this.repo.update(id, { status }); return this.repo.findOne({ where:{ id } }) }
  findOne(id: string) { return this.repo.findOne({ where:{ id } }) }
}
