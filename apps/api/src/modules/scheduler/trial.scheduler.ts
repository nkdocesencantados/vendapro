import { Injectable } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository, LessThan } from "typeorm"
import { Company } from "../companies/company.entity"

@Injectable()
export class TrialScheduler {
  constructor(@InjectRepository(Company) private repo: Repository<Company>) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireTrials() {
    await this.repo.update(
      { plan: "trial", status: "active", trialEndsAt: LessThan(new Date()) },
      { status: "blocked" }
    )
    console.log("[TrialScheduler] Trials expirados bloqueados")
  }
}
