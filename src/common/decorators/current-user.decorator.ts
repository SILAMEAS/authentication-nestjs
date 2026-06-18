import { User } from '../../db/schema';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type RequestWithUser = Request & { user: User };
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
