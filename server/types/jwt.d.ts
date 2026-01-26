import { UserRole } from "../generated/prisma/browser";

export interface RefreshJwtPayload {
  userId: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}
export interface AccessJwtPayload {
  userId: string;
  role?: UserRole;
  iat?: number;
  exp?: number;
}
