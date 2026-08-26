import { IsBoolean, IsISO8601, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateApprovalDto {
  @IsString()
  groupId!: string;

  @IsString()
  title!: string;

  @IsString()
  productName!: string;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsString()
  reason!: string;

  @IsString()
  budgetImpact!: string;

  @IsString()
  ruleType!: string;

  @IsISO8601()
  deadlineAt!: string;

  @IsOptional()
  @IsBoolean()
  allowRevote?: boolean;
}
