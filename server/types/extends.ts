import { Socket } from "socket.io";

export interface CustomSocketType extends Socket {
  user?: any;
}
