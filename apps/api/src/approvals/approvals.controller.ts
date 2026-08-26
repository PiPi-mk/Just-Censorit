import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { readCurrentUser } from '../common/http/current-user';
import { ApprovalsService } from './approvals.service';
import { CloseApprovalDto } from './dto/close-approval.dto';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { PublishApprovalDto } from './dto/publish-approval.dto';

@Controller()
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post('approvals')
  create(@Req() req: { headers: Record<string, string | string[] | undefined> }, @Body() dto: CreateApprovalDto) {
    return this.approvalsService.createApproval(readCurrentUser(req), dto);
  }

  @Get('groups/:groupId/approvals')
  list(
    @Req() req: { headers: Record<string, string | string[] | undefined> },
    @Param('groupId') groupId: string,
  ) {
    return this.approvalsService.listApprovals(groupId, readCurrentUser(req).userId);
  }

  @Get('approvals/:approvalId')
  detail(
    @Req() req: { headers: Record<string, string | string[] | undefined> },
    @Param('approvalId') approvalId: string,
  ) {
    return this.approvalsService.getApprovalDetail(approvalId, readCurrentUser(req).userId);
  }

  @Post('approvals/:approvalId/publish')
  publish(@Param('approvalId') approvalId: string, @Body() _dto: PublishApprovalDto) {
    return this.approvalsService.publishApproval(approvalId);
  }

  @Post('approvals/:approvalId/close')
  close(@Param('approvalId') approvalId: string, @Body() _dto: CloseApprovalDto) {
    return this.approvalsService.closeApproval(approvalId);
  }
}
