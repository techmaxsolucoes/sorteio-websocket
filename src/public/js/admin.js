let socket;

function connectWebSocket() {
  socket = new WebSocket(WS_URL);

  socket.addEventListener("open", handleSocketOpen);
  socket.addEventListener("message", handleSocketMessage);
  socket.addEventListener("error", handleSocketError);
  socket.addEventListener("close", handleSocketClose);
}

function handleSocketOpen() {
  console.log("Websocket conectado.");
  socket.send(JSON.stringify({ action: ACTIONS.ADMIN }));
}

function handleSocketMessage(event) {
  const data = JSON.parse(event.data);

  if (data.action === ACTIONS.CLIENT_COUNT_UPDATE) {
    updateClientCount(data.count);
    updateParticipants(data.codes);
  }
  else if (data.action === ACTIONS.CLIENT_WON){
    updateWinner(data.code);
  }
  else if (data.action === ACTIONS.CLIENT_LOST){
    updateLoser(data.code);
  }
}

function handleSocketError(error) {
  console.error("Erro no Websocket:", error);
}

function handleSocketClose() {
  console.log("Websocket fechado. Tentando reconectar em 5 segundos...");
  setTimeout(connectWebSocket(), 5000);
}

function updateClientCount(count) {
  document.getElementById("clientCount").innerText = count;
}

function updateParticipants(codes){
  let code, html = '', i = 0;

  html += `
  <table>
    <thead>
      <th>Código</th>
      <th>Endereço</th>
      <th>Ultima Conexão</th>
      <th>Nome do Participante</th>
      <th>Sorteado?</th>
      <th>Prêmio</th>
    </thead>
    <tbody>
  `;

  for (; i < codes.length; i++){
    code = codes[i];
    if (typeof code.code === 'undefined') continue;
    html += `
      <tr id="cli${code.code}">
        <td>${code.code}</td>
        <td>${code.address}</td>
        <td>${code.ts}</td>
        <td>${code.nome || "Não Identificado"}</td>
        <td>${code.sorteado || "Não"}</td>
        <td>${code.premio ?  `public/assets/images/${code.premio}`  : ""}</td>
      <tr/>
    `;
  }

  html += `
    </tbody>
  </table>
  `;


  document.getElementById('participants').innerHTML = html;
}

function updateWinner(code) {
  document.getElementById(`code${code}`).classList.add('win');
}

function updateLoser(code){
  document.getElementsByClassName(`code${code}`).classList.add('lose');
}

connectWebSocket();

const drawButton = document.getElementById("draw");
const messageDiv = document.getElementById("message");

drawButton.addEventListener("click", handleDrawClick);

function handleDrawClick() {
  const toDraw = 5;

  drawButton.setAttribute('disabled', 'disabled');
  drawButton.innerText = 'Sorteando';

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        action: ACTIONS.DRAW,
        toDraw,
      })
    );
  } else {
    console.warn(
      "Websocket não está aberto. Aguarde e tente novamente em instantes."
    );
  }
}

function displayConfirmationCode(code) {
  messageDiv.innerText = code;
  messageDiv.classList.remove("hide-message");
  messageDiv.classList.add("show-message");
  drawButton.innerText = "Sorteado!";
}


