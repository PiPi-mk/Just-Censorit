import { Module } from '@nestjs/common';
import { ApprovalsModule } from './approvals/approvals.module';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './config/env.validation';
import { GroupsModule } from './groups/groups.module';
import { PrismaModule } from './prisma/prisma.module';
import { ResultsModule } from './results/results.module';
import { VotesModule } from './votes/votes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (input) => envSchema.parse(input),
    }),
    PrismaModule,
    GroupsModule,
    ApprovalsModule,
    VotesModule,
    ResultsModule,
  ],
})
export class AppModule {}
