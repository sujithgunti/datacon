import { IsIn } from "class-validator";

export class FeedbackDto {
  @IsIn([-1, 0, 1])
  vote!: -1 | 0 | 1;
}
