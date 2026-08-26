import { Controller, Get, Param, Req } from '@nestjs/common';
import { readCurrentUser } from '../common/http/current-user';
import { ResultsService } from './results.service';

@Controller()
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get('approvals/:approvalId/result')
  getResult(
    @Req() req: { headers: Record<string, string | string[] | undefined> },
    @Param('approvalId') approvalId: string,
  ) {
    return this.resultsService.getApprovalResult(approvalId, readCurrentUser(req).userId);
  }
}
