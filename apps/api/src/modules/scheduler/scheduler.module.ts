import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Company } from "../companies/company.entity"
import { TrialScheduler } from "./trial.scheduler"

@Module({
  imports: [TypeOrmModule.forFeature([Company])],
  providers: [TrialScheduler],
})
export class SchedulerModule {}
