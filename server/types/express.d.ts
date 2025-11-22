import * as express from "express";

// Mở rộng kiểu Request để thêm thuộc tính 'user'
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        sessionId?: string;
      };
    }
  }
}
