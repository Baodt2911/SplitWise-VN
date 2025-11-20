import * as express from "express";

// Mở rộng kiểu Request để thêm thuộc tính 'user'
declare global {
  namespace Express {
    interface User {
      userId: string;
    }
    interface Request {
      user: User;
    }
  }
}
