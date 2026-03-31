import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentOrg = createParamDecorator(
  (data: unknown, context: ExecutionContext): string | null => {
    let user;

    const request = context.switchToHttp().getRequest();
    if (request?.user) {
      user = request.user;
    } else {
      const ctx = GqlExecutionContext.create(context);
      user = ctx.getContext().req?.user;
    }

    return user?.organizationId || null;
  },
);
