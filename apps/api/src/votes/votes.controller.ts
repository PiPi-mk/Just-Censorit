import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { readCurrentUser } from '../common/http/current-user';
import { UpsertVoteDto } from './dto/upsert-vote.dto';
import { VotesService } from './votes.service';

@Controller()
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post('approvals/:approvalId/vote')
  upsert(
    @Req() req: { headers: Record<string, string | string[] | undefined> },
    @Param('approvalId') approvalId: string,
    @Body() dto: UpsertVoteDto,
  ) {
    return this.votesService.upsertVote(readCurrentUser(req), approvalId, dto);
  }

  @Get('approvals/:approvalId/votes')
  list(
    @Req() req: { headers: Record<string, string | string[] | undefined> },
    @Param('approvalId') approvalId: string,
  ) {
    return this.votesService.listVotes(approvalId, readCurrentUser(req).userId);
  }
}
