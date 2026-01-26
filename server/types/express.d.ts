import * as express from "express";
import { UserRole } from "../generated/prisma/enums";

// Mở rộng kiểu Request để thêm thuộc tính 'user'
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        sessionId?: string;
        role?: UserRole;
      };
    }
  }
}
