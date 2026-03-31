import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { ORG_ROLES_KEY } from '../decorators/org-roles.decorator';
import { OrgRole } from '@prisma/client';

@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    let user;

    const request = context.switchToHttp().getRequest();
    if (request?.user) {
      user = request.user;
    } else {
      const ctx = GqlExecutionContext.create(context);
      user = ctx.getContext().req?.user;
    }

    if (!user) {
      throw new ForbiddenException('Пользователь не авторизован');
    }

    if (!user.organizationId) {
      throw new ForbiddenException('Требуется контекст организации');
    }

    // Check org roles if specified
    const requiredRoles = this.reflector.getAllAndOverride<OrgRole[]>(ORG_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && requiredRoles.length > 0) {
      if (!user.orgRole || !requiredRoles.includes(user.orgRole)) {
        throw new ForbiddenException('Недостаточно прав для этого действия');
      }
    }

    return true;
  }
}
