export interface RefreshJwtPayload {
  userId: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}
export interface AccessJwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}
