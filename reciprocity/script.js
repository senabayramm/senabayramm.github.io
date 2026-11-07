// ============================================================================
// DESIGN CONFIGURATION (TASARIM YAPILANDIRMASI)
// Bu nesne, diyalog kurallarını, geçmiş hassasiyetini ve görsel yanıt parametrelerini belirler.
// ============================================================================
const DESIGN = {
  maxHistoryLength: 8,         // Sistem kaç önceki tura bakarak yanıt üretecek? (Bellek derinliği)
  rushThresholdMs: 400,        // Hızlı tıklama/sabırsızlık eşiği (milisaniye)
  baseExpansionSpeed: 2.0,     // Normal yankı yayılma hızı
  rushExpansionSpeed: 4.5,     // Sabırsız/hızlı girdi durumundaki yankı hızı
  maxRadius: 180,              // Yankı halkasının ulaşacağı maksimum boyut
  keyboardStep: 15,            // Klavye yön tuşları hareket adımı

  // Renk ve Ton Paleti (Sadece renge değil, form ve hıza dayalı geri bildirim)
  colors: {
    background: '#121215',
    calm: '#38bdf8',           // Dengeli ve sakin diyalog tonu (Mavi)
    tense: '#f43f5e'           // Hızlı ve gergin diyalog tonu (Kırmızı/Pembe)
  }
};

// ============================================================================
// STATE (SİSTEM DURUMU VE GEÇMİŞ HAFIZASI)
// ============================================================================
const state = {
  dialogueHistory: [],         // Katılımcının geçmiş hamlelerinin zaman ve konum verileri
  echoes: [],                  // Sistem tarafından üretilen yanıt yankıları
  isPaused: false,
  keyboardCursor: { x: 400, y: 250, visible: false },
  canvasWidth: 800,
  canvasHeight: 500,
  lastInteractionTime: 0
};

// DOM Elemanları
const canvas = document.getElementById('resonanceCanvas');
const ctx = canvas.getContext('2d');
const cursorEl = document.getElementById('keyboardCursor');
const rhythmEl = document.getElementById('rhythmState');
const historyCountEl = document.getElementById('historyCount');
const btnPause = document.getElementById('btnPause');
const btnReset = document.getElementById('btnReset');

// ============================================================================
// INPUT (GİRDİ YÖNETİMİ)
// ============================================================================
function getCanvasCoords(event) {
  const rect = canvas.getBoundingClientRect();
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height)
  };
}

// Katılımcının hamlesini kaydet ve sistemin yanıtını tetikle
function registerParticipantTurn(x, y) {
  const now = performance.now();
  const timeDiff = state.lastInteractionTime ? (now - state.lastInteractionTime) : 1000;
  state.lastInteractionTime = now;

  // Geçmiş hafızasına ekleme (History that matters)
  if (state.dialogueHistory.length >= DESIGN.maxHistoryLength) {
    state.dialogueHistory.shift();
  }

  const isRushing = timeDiff < DESIGN.rushThresholdMs;

  state.dialogueHistory.push({
    x: x,
    y: y,
    rushing: isRushing,
    time: now
  });

  // Sistem Yanıtı (Reciprocity Response): Geçmişin ortalamasına göre tepki üret
  generateSystemReply(x, y, isRushing);
}

// Sistem Yanıt Üretme Kuralı
function generateSystemReply(x, y, isRushing) {
  // Sistem, katılımcının temposuna karşılık veriyor (Reciprocity)
  const speed = isRushing ? DESIGN.rushExpansionSpeed : DESIGN.baseExpansionSpeed;
  const color = isRushing ? DESIGN.colors.tense : DESIGN.colors.calm;

  state.echoes.push({
    x: x,
    y: y,
    currentRadius: 5,
    maxRadius: DESIGN.maxRadius + (isRushing ? 40 : 0),
    speed: speed,
    color: color,
    alpha: 1.0
  });
}

// Fare Tıklaması
canvas.addEventListener('click', (e) => {
  const coords = getCanvasCoords(e);
  registerParticipantTurn(coords.x, coords.y);
});

// Dokunmatik Ekran
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const coords = getCanvasCoords(e);
  registerParticipantTurn(coords.x, coords.y);
}, { passive: false });

// Klavye Kontrolleri
canvas.addEventListener('keydown', (e) => {
  state.keyboardCursor.visible = true;
  updateCursorPosition();

  switch (e.key) {
    case 'ArrowUp':
      state.keyboardCursor.y = Math.max(10, state.keyboardCursor.y - DESIGN.keyboardStep);
      break;
    case 'ArrowDown':
      state.keyboardCursor.y = Math.min(state.canvasHeight - 10, state.keyboardCursor.y + DESIGN.keyboardStep);
      break;
    case 'ArrowLeft':
      state.keyboardCursor.x = Math.max(10, state.keyboardCursor.x - DESIGN.keyboardStep);
      break;
    case 'ArrowRight':
      state.keyboardCursor.x = Math.min(state.canvasWidth - 10, state.keyboardCursor.x + DESIGN.keyboardStep);
      break;
    case ' ':
    case 'Enter':
      e.preventDefault();
      registerParticipantTurn(state.keyboardCursor.x, state.keyboardCursor.y);
      break;
    case 'p':
    case 'P':
      togglePause();
      break;
  }
  updateCursorPosition();
});

// Duraklatma ve Sıfırlama Butonları
btnPause.addEventListener('click', togglePause);
btnReset.addEventListener('click', resetDialogue);

function togglePause() {
  state.isPaused = !state.isPaused;
  btnPause.textContent = state.isPaused ? 'Resume Dialogue' : 'Pause Dialogue';
}

function resetDialogue() {
  state.dialogueHistory = [];
  state.echoes = [];
  state.isPaused = false;
  btnPause.textContent = 'Pause Dialogue';
}

// ============================================================================
// RULES & UPDATE (SİSTEM KURALLARI VE YANIT GÜNCELLEME)
// ============================================================================
function updateRules() {
  if (state.isPaused) return;

  // Yankı halkalarını güncelle
  for (let i = state.echoes.length - 1; i >= 0; i--) {
    let echo = state.echoes[i];
    echo.currentRadius += echo.speed;
    echo.alpha = 1 - (echo.currentRadius / echo.maxRadius);

    if (echo.currentRadius >= echo.maxRadius || echo.alpha <= 0) {
      state.echoes.splice(i, 1);
    }
  }
}

// ============================================================================
// OUTPUT (GÖRSEL ÇIKTI VE ARAYÜZ)
// ============================================================================
function render() {
  ctx.fillStyle = DESIGN.colors.background;
  ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

  // Son hamlelerin hız durumunu hesapla
  const recentRushCount = state.dialogueHistory.filter(h => h.rushing).length;
  const isTenseSystem = recentRushCount > (state.dialogueHistory.length / 2);

  // Yankıları Çiz
  state.echoes.forEach(echo => {
    ctx.beginPath();
    ctx.arc(echo.x, echo.y, echo.currentRadius, 0, Math.PI * 2);
    ctx.strokeStyle = echo.color;
    ctx.globalAlpha = Math.max(0, echo.alpha);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1.0; // Reset alpha
  });

  // Geçmiş Noktalarını (İzleri) Çiz
  state.dialogueHistory.forEach((h, index) => {
    ctx.beginPath();
    ctx.arc(h.x, h.y, 4 + (index * 0.5), 0, Math.PI * 2);
    ctx.fillStyle = h.rushing ? DESIGN.colors.tense : DESIGN.colors.calm;
    ctx.fill();
  });

  // Panel Metinlerini Güncelle
  historyCountEl.textContent = state.dialogueHistory.length;
  rhythmEl.textContent = isTenseSystem ? 'Tense / Rapid' : 'Balanced / Calm';
  rhythmEl.style.color = isTenseSystem ? DESIGN.colors.tense : DESIGN.colors.calm;
}

function updateCursorPosition() {
  if (state.keyboardCursor.visible) {
    cursorEl.hidden = false;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / state.canvasWidth;
    const scaleY = rect.height / state.canvasHeight;

    cursorEl.style.left = `${state.keyboardCursor.x * scaleX}px`;
    cursorEl.style.top = `${state.keyboardCursor.y * scaleY}px`;
  }
}

// Ana Döngü
function loop() {
  updateRules();
  render();
  requestAnimationFrame(loop);
}

loop();