import { io, Socket } from "socket.io-client";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const SOCKET_URL = __DEV__
  ? Platform.OS === "android"
    ? "http://192.168.32.10:3000"
    : "http://localhost:3000"
  : "https://api.yourdomain.com";

class SocketService {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;

  async connect() {
    if (this.socket?.connected || this.isConnecting) return;
    this.isConnecting = true;

    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) {
        this.isConnecting = false;
        return;
      }

      this.socket = io(SOCKET_URL, {
        auth: {
          token,
        },
        transports: ["websocket"],
      });

      this.socket.on("connect", () => {
        console.log("[SOCKET] Connected successfully:", this.socket?.id);
      });

      this.socket.on("connect_error", (error) => {
        console.error("[SOCKET] Connection error:", error.message);
      });
    } catch (e) {
      console.error("[SOCKET] Exception connecting:", e);
    } finally {
      this.isConnecting = false;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      // Allow late binding by scheduling it or relying on component reconnecting
      return;
    }
    this.socket.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
