// Elementos da tela
const canvas = document.getElementById("tela-jogo");
const contexto = canvas.getContext("2d");
const textoRodada = document.getElementById("texto-rodada");
const textoPontos = document.getElementById("texto-pontos");
const textoConta = document.getElementById("texto-conta");
const overlayMensagem = document.getElementById("overlay-mensagem");
const tituloAviso = document.getElementById("titulo-aviso");
const descricaoAviso = document.getElementById("descricao-aviso");
const botaoAcao = document.getElementById("botao-acao");
const botoesSeta = document.querySelectorAll(".btn-seta");

// Configurações do tabuleiro (20x20 quadrados de 20px cada)
const tamanhoQuadrado = 20;
const totalColunas = canvas.width / tamanhoQuadrado;
const totalLinhas = canvas.height / tamanhoQuadrado;
const totalRodadas = 10;

// Estado do jogo
let cobrinha = [];
let direcaoAtual = "DIREITA";
let proximaDirecao = "DIREITA";
let macas = [];
let rodadaAtual = 1;
let pontos = 0;
let maximoPontos = totalRodadas * 10;
let desafioAtual = null;
let jogoRodando = false;
let loopJogo = null;
let tempoInicio = 0;
let estadoBotao = "INICIAR"; // INICIAR, PROXIMA, REINICIAR

// Lista de 10 desafios com dificuldade crescente
function criarDesafio(rodada) {
  if (rodada === 1) {
    return { conta: "2 + 3 = ?", correta: 5, erradas: [4, 6], explicacao: "Contando a partir do 2 mais 3 passos: 3, 4, 5." };
  }
  if (rodada === 2) {
    return { conta: "4 + 5 = ?", correta: 9, erradas: [8, 10], explicacao: "4 mais 5 é igual a 9." };
  }
  if (rodada === 3) {
    return { conta: "10 - 3 = ?", correta: 7, erradas: [6, 8], explicacao: "Tirando 3 de 10, sobram 7." };
  }
  if (rodada === 4) {
    return { conta: "6 + 6 = ?", correta: 12, erradas: [11, 14], explicacao: "O dobro de 6 é 12 (6 + 6 = 12)." };
  }
  if (rodada === 5) {
    return { conta: "15 - 7 = ?", correta: 8, erradas: [7, 9], explicacao: "De 7 para chegar em 15 faltam 8." };
  }
  if (rodada === 6) {
    return { conta: "3 × 4 = ?", correta: 12, erradas: [7, 15], explicacao: "3 grupos de 4 somam 12 (4 + 4 + 4)." };
  }
  if (rodada === 7) {
    return { conta: "9 + 8 = ?", correta: 17, erradas: [16, 18], explicacao: "9 + 8 é o mesmo que 10 + 7, que dá 17." };
  }
  if (rodada === 8) {
    return { conta: "20 - 6 = ?", correta: 14, erradas: [13, 16], explicacao: "20 menos 6 é igual a 14." };
  }
  if (rodada === 9) {
    return { conta: "5 × 5 = ?", correta: 25, erradas: [20, 30], explicacao: "Contando de 5 em 5 cinco vezes: 5, 10, 15, 20, 25." };
  }
  return { conta: "14 + 9 = ?", correta: 23, erradas: [21, 24], explicacao: "14 + 9 = 23." };
}

// Posiciona as maçãs sem encostar na cobrinha ou uma na outra
function gerarMacas(desafio) {
  const opcoes = [
    { valor: desafio.correta, certa: true },
    { valor: desafio.erradas[0], certa: false },
    { valor: desafio.erradas[1], certa: false }
  ];

  // Embaralha as opções
  opcoes.sort(() => Math.random() - 0.5);

  const novasMacas = [];
  for (let i = 0; i < opcoes.length; i++) {
    let x, y, posicaoOcupada;
    do {
      x = Math.floor(Math.random() * (totalColunas - 2)) + 1;
      y = Math.floor(Math.random() * (totalLinhas - 2)) + 1;
      posicaoOcupada =
        cobrinha.some(parte => parte.x === x && parte.y === y) ||
        novasMacas.some(m => m.x === x && m.y === y);
    } while (posicaoOcupada);

    novasMacas.push({
      x: x,
      y: y,
      valor: opcoes[i].valor,
      certa: opcoes[i].certa
    });
  }
  return novasMacas;
}

// Inicia ou reinicia uma rodada
function prepararRodada() {
  cobrinha = [
    { x: 6, y: 10 },
    { x: 5, y: 10 },
    { x: 4, y: 10 }
  ];
  direcaoAtual = "DIREITA";
  proximaDirecao = "DIREITA";

  desafioAtual = criarDesafio(rodadaAtual);
  macas = gerarMacas(desafioAtual);

  textoRodada.textContent = `${rodadaAtual}/${totalRodadas}`;
  textoPontos.textContent = pontos;
  textoConta.textContent = desafioAtual.conta;

  overlayMensagem.classList.add("escondido");
  jogoRodando = true;

  // Aumenta levemente a velocidade conforme a rodada avança
  const velocidadeMs = Math.max(120, 210 - rodadaAtual * 8);
  clearInterval(loopJogo);
  loopJogo = setInterval(atualizarJogo, velocidadeMs);
  desenharTela();
}

// Mostra uma tela de aviso entre as rodadas ou no fim
function mostrarAviso(titulo, texto, textoBotao, novoEstado) {
  jogoRodando = false;
  clearInterval(loopJogo);
  tituloAviso.textContent = titulo;
  descricaoAviso.textContent = texto;
  botaoAcao.textContent = textoBotao;
  estadoBotao = novoEstado;
  overlayMensagem.classList.remove("escondido");
  notificarAlturaPortal();
}

// Atualiza o movimento e verifica colisões
function atualizarJogo() {
  if (!jogoRodando) return;

  direcaoAtual = proximaDirecao;
  const cabeca = { ...cobrinha[0] };

  if (direcaoAtual === "CIMA") cabeca.y -= 1;
  if (direcaoAtual === "BAIXO") cabeca.y += 1;
  if (direcaoAtual === "ESQUERDA") cabeca.x -= 1;
  if (direcaoAtual === "DIREITA") cabeca.x += 1;

  // Verifica se bateu na parede da lousa
  const bateuParede =
    cabeca.x < 0 || cabeca.x >= totalColunas ||
    cabeca.y < 0 || cabeca.y >= totalLinhas;

  // Verifica se bateu no próprio corpo
  const bateuCorpo = cobrinha.some(parte => parte.x === cabeca.x && parte.y === cabeca.y);

  if (bateuParede || bateuCorpo) {
    tratarErro("Você bateu na borda da lousa ou no corpo da cobra!");
    return;
  }

  cobrinha.unshift(cabeca);

  // Verifica se comeu alguma maçã
  const indiceMaca = macas.findIndex(m => m.x === cabeca.x && m.y === cabeca.y);

  if (indiceMaca !== -1) {
    const macaComida = macas[indiceMaca];
    if (macaComida.certa) {
      pontos += 10;
      textoPontos.textContent = pontos;
      avancarRodada(true);
    } else {
      tratarErro(`Você comeu o número ${macaComida.valor}, mas a resposta era ${desafioAtual.correta}.`);
    }
    return;
  } else {
    // Remove a cauda se não comeu nada
    cobrinha.pop();
  }

  desenharTela();
}

function tratarErro(motivo) {
  const mensagemCompleta = `${motivo} ${desafioAtual.explicacao}`;
  if (rodadaAtual >= totalRodadas) {
    finalizarJogo(mensagemCompleta);
  } else {
    rodadaAtual += 1;
    mostrarAviso("Ops! Não foi dessa vez", mensagemCompleta, "Próxima Conta", "PROXIMA");
  }
}

function avancarRodada(acertou) {
  const mensagemCompleta = `Muito bem! ${desafioAtual.explicacao}`;
  if (rodadaAtual >= totalRodadas) {
    finalizarJogo(mensagemCompleta);
  } else {
    rodadaAtual += 1;
    mostrarAviso("Acertou!", mensagemCompleta, "Próxima Conta", "PROXIMA");
  }
}

function finalizarJogo(ultimaExplicacao) {
  const tempoEmMs = Date.now() - tempoInicio;
  const resumoFinal = `${ultimaExplicacao} Você fez ${pontos} de ${maximoPontos} pontos!`;

  mostrarAviso("Fim de Jogo!", resumoFinal, "Jogar Novamente", "REINICIAR");

  // Envia o resultado para o portal da escola
  window.parent.postMessage(
    {
      type: "vrgame:finish",
      score: pontos,
      maxScore: maximoPontos,
      timeMs: tempoEmMs,
      detail: { jogo: "cobra-inteligente" }
    },
    "*"
  );
}

// Desenha a lousa, as maçãs com números e a cobrinha
function desenharTela() {
  contexto.clearRect(0, 0, canvas.width, canvas.height);

  // Linhas suaves de grade na lousa
  contexto.strokeStyle = "rgba(255, 255, 255, 0.06)";
  contexto.lineWidth = 1;
  for (let i = 0; i < totalColunas; i++) {
    contexto.beginPath();
    contexto.moveTo(i * tamanhoQuadrado, 0);
    contexto.lineTo(i * tamanhoQuadrado, canvas.height);
    contexto.stroke();

    contexto.beginPath();
    contexto.moveTo(0, i * tamanhoQuadrado);
    contexto.lineTo(canvas.width, i * tamanhoQuadrado);
    contexto.stroke();
  }

  // Desenha as maçãs com os números
  macas.forEach(maca => {
    const centroX = maca.x * tamanhoQuadrado + tamanhoQuadrado / 2;
    const centroY = maca.y * tamanhoQuadrado + tamanhoQuadrado / 2;

    // Círculo da maçã
    contexto.fillStyle = "#e63946";
    contexto.beginPath();
    contexto.arc(centroX, centroY, tamanhoQuadrado * 0.65, 0, Math.PI * 2);
    contexto.fill();

    // Folhinha verde
    contexto.fillStyle = "#80ed99";
    contexto.fillRect(centroX - 2, centroY - tamanhoQuadrado * 0.85, 5, 5);

    // Número dentro da maçã
    contexto.fillStyle = "#ffffff";
    contexto.font = "bold 13px sans-serif";
    contexto.textAlign = "center";
    contexto.textBaseline = "middle";
    contexto.fillText(maca.valor, centroX, centroY + 1);
  });

  // Desenha a cobrinha estilo giz
  cobrinha.forEach((parte, index) => {
    contexto.fillStyle = index === 0 ? "#ffd166" : "#a8e6cf";
    contexto.beginPath();
    contexto.roundRect(
      parte.x * tamanhoQuadrado + 1,
      parte.y * tamanhoQuadrado + 1,
      tamanhoQuadrado - 2,
      tamanhoQuadrado - 2,
      5
    );
    contexto.fill();
  });
}

// Muda a direção evitando que a cobra dê meia-volta nela mesma
function mudarDirecao(novaDirecao) {
  if (!jogoRodando) return;
  if (novaDirecao === "CIMA" && direcaoAtual !== "BAIXO") proximaDirecao = "CIMA";
  if (novaDirecao === "BAIXO" && direcaoAtual !== "CIMA") proximaDirecao = "BAIXO";
  if (novaDirecao === "ESQUERDA" && direcaoAtual !== "DIREITA") proximaDirecao = "ESQUERDA";
  if (novaDirecao === "DIREITA" && direcaoAtual !== "ESQUERDA") proximaDirecao = "DIREITA";
}

// Controles pelo teclado
document.addEventListener("keydown", evento => {
  if (evento.key === "ArrowUp" || evento.key === "w" || evento.key === "W") {
    evento.preventDefault();
    mudarDirecao("CIMA");
  } else if (evento.key === "ArrowDown" || evento.key === "s" || evento.key === "S") {
    evento.preventDefault();
    mudarDirecao("BAIXO");
  } else if (evento.key === "ArrowLeft" || evento.key === "a" || evento.key === "A") {
    evento.preventDefault();
    mudarDirecao("ESQUERDA");
  } else if (evento.key === "ArrowRight" || evento.key === "d" || evento.key === "D") {
    evento.preventDefault();
    mudarDirecao("DIREITA");
  }
});

// Controles pelos botões na tela (celular)
botoesSeta.forEach(botao => {
  botao.addEventListener("click", () => {
    mudarDirecao(botao.dataset.direcao);
  });
});

// Ação do botão principal (Começar / Próxima Conta / Jogar Novamente)
botaoAcao.addEventListener("click", () => {
  if (estadoBotao === "INICIAR" || estadoBotao === "REINICIAR") {
    rodadaAtual = 1;
    pontos = 0;
    tempoInicio = Date.now();
  }
  prepararRodada();
});

// --- Contrato de comunicação com o portal ---
function notificarAlturaPortal() {
  const altura = document.documentElement.scrollHeight;
  window.parent.postMessage({ type: "vrgame:resize", height: altura }, "*");
}

window.addEventListener("message", evento => {
  const dados = evento.data;
  if (!dados || typeof dados !== "object") return;

  if (dados.type === "vrgame:theme") {
    const tema = dados.theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", tema);
  }

  if (dados.type === "vrgame:fullscreen") {
    if (dados.fullscreen && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (!dados.fullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }
});

window.addEventListener("resize", notificarAlturaPortal);

window.addEventListener("load", () => {
  window.parent.postMessage({ type: "vrgame:ready" }, "*");
  notificarAlturaPortal();
});