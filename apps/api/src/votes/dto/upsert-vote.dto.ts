import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertVoteDto {
  @IsIn(['agree', 'reject'])
  voteChoice!: 'agree' | 'reject';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  voteReason?: string;
}
