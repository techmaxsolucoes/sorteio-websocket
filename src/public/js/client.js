let socket = new WebSocket(WS_URL);
const body = document.querySelector("body");
const logo = document.getElementById("logo");
const loadDiv = document.getElementById("loading");
const codeDiv = document.getElementById("win-code")

socket.addEventListener("message", handleServerMessage);

function register() {
  let greetingsP = document.getElementById('greetings')
  let indicator = document.getElementById('qtd-indicator');

  let joinCtaSection = document.querySelector('.join-cta');
  let nameInput = document.getElementById("name");
  let clientName = nameInput.value || localStorage.name;
  if (!clientName) {
    alert('Você precisa preencher o seu nome para participar do sorteio!');
    return;
  }

  localStorage.nome = clientName;
  let mobileFooter = document.getElementById('footer-mobile')
  let btnJoin = document.querySelector('.join-btn.desktop')

  joinCtaSection.style.display = 'none'
  btnJoin.style.display = 'none'
  mobileFooter.style.display = 'none'
  nameInput.style.display = 'none'

  indicator.classList.toggle("hide-message");
  indicator.classList.toggle("show-message");

  greetingsP.innerHTML = `Boa sorte, ${clientName}!`;
  greetingsP.style.display = 'block';

  document.getElementById('participante').innerText = clientName;
  document.getElementById('participante1').innerText = clientName;

  socket.send(JSON.stringify({
    'action': 'updatename',
    'nome': clientName
  }));

}

function handleServerMessage(event) {
  const data = JSON.parse(event.data);
  console.log("Mensagem recebida do servidor:", data);

  switch (data.status) {
    case ACTIONS.CLIENT_COUNT_UPDATE:
      updateClientCount(data.count);
      break;
    case STATUS.WIN:
      setClientState("win", data.code, data.livro);
      break;
    case STATUS.LOSE:
      setClientState("lose");
      break;
  }
}

function setClientState(state, code = "", livro = "") {
  // Início da animação
  body.className = "main";
  logo.classList.toggle("stop-spin", false);
  logo.classList.toggle("spin-animation", true);
  loadDiv.classList.toggle("show-message");
  loadDiv.classList.toggle("hide-message")
  document.getElementById('boas_vindas').classList.toggle('hide-message', true);

  setTimeout(() => {
    if (state === "win") {
      body.classList.add("win");
      codeDiv.innerText = code;
      vibratePhone(1000);
    } else if (state === "lose") {
      body.classList.add("lose");
    }
    loadDiv.classList.toggle("show-message");
    loadDiv.classList.toggle("hide-message");
    document.getElementById('imglivro').setAttribute('src', `public/assets/images/${livro}`);
    document.getElementById('ganhou').classList.toggle('show-message', state === 'win');
    document.getElementById('ganhou').classList.toggle('hide-message', state !== 'win');
    document.getElementById('que_pena').classList.toggle('show-message', state !== 'win');
    document.getElementById('que_pena').classList.toggle('hide-message', state === 'win');
    logo.classList.toggle("spin-animation", false);
    logo.classList.toggle("stop-spin", true);
  }, 4100);
}

function vibratePhone(timeMs) {
  if (navigator.vibrate) {
    navigator.vibrate(timeMs);
  }
}


function updateClientCount(count) {
  document.getElementById("clientCount").innerText = count === 0 ? 'nenhum' : count;
  document.getElementById("clientCount1").innerText = count === 0 ? 'nenhum' : count;
  document.getElementById("clientCount2").innerText = count === 0 ? 'nenhum' : count;
}

window.document.onload = () => {
  if (localStorage.name) register();
}