const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws'});

const APP_PORT = process.env.PORT || 3000;
const APP_URL = process.env.URL || `http://0.0.0.0:${APP_PORT}`;
//const APP_URL = process.env.URL || `http://localhost:${APP_PORT}`;

const ACTIONS = {
  ADMIN: "admin",
  DRAW: "draw",
  UPDATE_NAME: 'updatename',
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
  updateAdminClientCount();

  ws.on("close", () => {
    clients = clients.filter((client) => client !== ws);
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
    case 'updatename':
      ws.app_name = data.nome;
      console.log(`Associando nome "${ws.app_name} -> ${ws.app_code}"`)
      updateAdminClientCount();
      break;
    case ACTIONS.DRAW:
      handleDraw(data.toDraw);
      break;
    default:
      console.warn("Ação desconhecida:", action);
  }
}

function updateName(ip, name){
  Array.from(wss.clients).filter(client => client._socket.remoteAddress === ip).forEach(client => {
    client.app_name = name
  });
  updateAdminClientCount();
}

function handleDraw(toDraw) {
  let admin = Array.from(wss.clients).filter(client => client.isAdmin)[0], 
    participants = Array.from(wss.clients).filter(
    (client) => !client.isAdmin && client.app_name && client.app_name.length
  ), winners = [];
  
  let books = [
    'livro-o-homem-mais-rico-da-babilonia.png',
    'livro-pai-rico-pai-pobre.png',
    'livro-do-milhao-ao-milhao.png',
    'livro-psicologia-finaceira.png',
    'livro-o-homem-mais-rico-da-babilonia.png'
  ];

  toDraw = 5;

  let pick;

  while (winners.length <= toDraw){
    pick = participants[Math.floor(Math.random() * participants.length)].app_code;
    if (!winners.includes(pick)) winners.push(pick);
  }
  console.log(`Winners: ${toDraw}`);
  console.log(winners);
  participants.forEach((client) => {
    let result = JSON.stringify({ status: "youlose" });
    if (winners.includes(client.app_code)) {
      client.app_premio = books.pop(0);
      client.app_sorteado = true;
      result = JSON.stringify({ 
        status: "youwin", 
        code: client.app_code , 
        "livro": client.app_premio,
        "count": participants.length -1 
      });
      console.log(`Código Sorteado: ${client.app_code}`);
    }
    client.send(result);
  });
  updateAdminClientCount();
}

function updateAdminClientCount() {
  const clientCount = Array.from(wss.clients).filter(
    (client) => !client.isAdmin && client.app_name && client.app_name.length
  ).length

  let data = {
    action: ACTIONS.CLIENT_COUNT_UPDATE,
    count: clientCount,
    codes: clients.filter(client => client.app_name && client.app_name.length).map(client => {
      return {
        address: client._socket.remoteAddress,
        code: client.app_code,
        ts: client.app_ts,
        name: client.app_name,
        sorteado: client.app_sorteado,
        premio: client.app_premio
      }
    })
  };

  console.log(JSON.stringify(data, null, 2))

  Array.from(wss.clients).forEach((client) => {
    client.send(
      JSON.stringify(data)
    );
  });
}

