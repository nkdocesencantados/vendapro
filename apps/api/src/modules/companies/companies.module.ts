import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CompaniesService } from "./companies.service"
import { CompaniesController } from "./companies.controller"
import { Company } from "./company.entity"
import { User } from "../users/user.entity"
import { Store } from "../stores/store.entity"

@Module({
  imports: [TypeOrmModule.forFeature([Company, User, Store])],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}