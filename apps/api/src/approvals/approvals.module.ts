import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ResultsModule } from '../results/results.module';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';

@Module({
  imports: [PrismaModule, ResultsModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
