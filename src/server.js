const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws'});

const APP_PORT = process.env.PORT || 3000;
const APP_URL = process.env.URL || `http://localhost:${APP_PORT}`;

const ACTIONS = {
  ADMIN: "admin",
  DRAW: "draw",
  CLIENT_COUNT_UPDATE: "clientCountUpdate",
};

app.use("/public", express.static("public"));
app.get("/", (req, res) => res.sendFile(__dirname + "/public/index.html"));
app.get("/admin", (req, res) => res.sendFile(__dirname + "/public/admin.html"));

server.listen(APP_PORT, () =>
  console.log(`Servidor ouvindo no host ${APP_URL}!`)
);

let clients = [];
let clientCodes = [];

function generateCode(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}

wss.on("connection", (ws, req) => {
  ws.app_code = generateCode(4);
  ws.app_ts = new Date();

  clients.push(ws);
  clientCodes.push([{
    address: req.socket.remoteAddress,
    code: ws.app_code,
    ts: ws.app_ts
  }]);
  updateAdminClientCount();

  ws.on("close", () => {
    clients = clients.filter((client) => client !== ws);
    clientCodes = clients.map(client => {
      return {
        address: req.socket.remoteAddress,
        code: client.app_code,
        ts: client.app_ts
      }
    });
    updateAdminClientCount();
  });

  ws.on("message", handleIncomingMessage.bind(null, ws));
});

function handleIncomingMessage(ws, msg) {
  const data = JSON.parse(msg);
  const action = data.action;

  switch (action) {
    case ACTIONS.ADMIN:
      ws.isAdmin = true;
      break;
    case ACTIONS.DRAW:
      handleDraw(data.toDraw);
      break;
    default:
      console.warn("Ação desconhecida:", action);
  }
}

function handleDraw(toDraw) {
  let admin = Array.from(wss.clients).filter(client => client.isAdmin)[0], 
    participants = Array.from(wss.clients).filter(
    (client) => !client.isAdmin
  ), winners = [];
  
  while (winners.length < toDraw && winners.length <= participants.length){
    winners.push(
      participants[Math.floor(Math.random() * participants.length)].app_code
    );
  }
  console.log(`Winners: ${toDraw}`);
  console.log(winners);
  participants.forEach((client) => {
    let result = JSON.stringify({ status: "youlose" });
    if (winners.includes(client.app_code)) {
      result = JSON.stringify({ status: "youwin", code: client.app_code });
      console.log(`Código Sorteado: ${client.app_code}`);
    }
    client.send(result);
  });
}

function updateAdminClientCount() {
  const clientCount = Array.from(wss.clients).filter(
    (client) => !client.isAdmin
  ).length;

  Array.from(wss.clients).forEach((client) => {
    if (client.isAdmin && client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          action: ACTIONS.CLIENT_COUNT_UPDATE,
          count: clientCount,
          codes: clientCodes
        })
      );
    } else if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          status: ACTIONS.CLIENT_COUNT_UPDATE,
          count: clientCount - 1
        })
      );
    }
  });
}
