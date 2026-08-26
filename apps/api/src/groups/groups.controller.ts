import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { readCurrentUser } from '../common/http/current-user';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { GroupsService } from './groups.service';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@Req() req: { headers: Record<string, string | string[] | undefined> }, @Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(readCurrentUser(req), dto);
  }

  @Post('join')
  join(@Req() req: { headers: Record<string, string | string[] | undefined> }, @Body() dto: JoinGroupDto) {
    return this.groupsService.joinGroup(readCurrentUser(req), dto);
  }

  @Get('my')
  myGroups(@Req() req: { headers: Record<string, string | string[] | undefined> }) {
    return this.groupsService.listMyGroups(readCurrentUser(req).userId);
  }

  @Get(':groupId/members')
  listMembers(
    @Req() req: { headers: Record<string, string | string[] | undefined> },
    @Param('groupId') groupId: string,
  ) {
    return this.groupsService.listMembers(groupId, readCurrentUser(req).userId);
  }
}
