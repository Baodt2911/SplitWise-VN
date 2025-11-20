import { Socket } from "socket.io";
import { JwtPayload as JsonWebTokenPayload } from "jsonwebtoken";
export interface CustomJwtPayload extends JsonWebTokenPayload {
  userId: string;
}

export interface CustomSocketType extends Socket {
  user?: any;
}
