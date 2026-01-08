import { io } from "socket.io-client";

const usersTokens = [
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmZDRiZjQ5ZS03NmIwLTQ0NzAtOGMzYS1mZTUzODM0MWZkNzUiLCJpYXQiOjE3Njc2Nzk0NjQsImV4cCI6MTc2ODk3NTQ2NH0.WXaj0qDNteLDOVokbJtQ-nt7FwYXbT19U4sdQO1UoMw",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNDRiMWM0My0wYjcwLTQ4MGUtYjAxOC0wODY1ZjIyZDAyOTYiLCJpYXQiOjE3Njc2Nzk0ODIsImV4cCI6MTc2ODk3NTQ4Mn0.O19EoLUPus_uYYsE8ihFa1g6QmLEr34tBHZ7hZWhkUo",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhOTVjMzQ3Yi00NWZhLTQxY2ItYTk4OS1hNmI0N2ZjZDQ5ZTIiLCJpYXQiOjE3Njc2Nzk1MDEsImV4cCI6MTc2ODk3NTUwMX0.jOva81a72abgm6vUUVGb3sRk6YnnC_Z0pORllLJFisU",
];

usersTokens.forEach((u) => {
  const socket = io("http://localhost:3000", {
    auth: {
      token: u,
    },
  });

  socket.on("connect", () => {
    console.log("✅ Connected:", socket.id);

    socket.emit(
      "join-group",
      "491132ea-63f2-4340-94f2-dde36d44b8e3",
      (res: any) => {
        console.log("ACK:", res);
      }
    );
  });

  socket.on("notification:new", (data) => {
    console.log("🔔 Notification:", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected");
  });
});
