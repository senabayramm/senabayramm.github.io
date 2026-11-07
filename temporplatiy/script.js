// ============================================================================
// DESIGN CONFIGURATION (TASARIM YAPILANDIRMASI)
// Bu nesne, zaman akışını, izlerin solma (decay) hızını ve hafıza kapasitesini belirler.
// ============================================================================
const DESIGN = {
  maxTraces: 100,              // Bellekte tutulabilecek maksimum geçmiş iz sayısı (Hafıza sınırı)
  decayRate: 0.006,            // İzlerin her karede kaybetttiği yaşam gücü / opaklık oranı
  initialRadius: 12,           // Yeni bırakılan izin başlangıç boyutu (piksel)
  maxHistoryAge: 1.0,          // Tam yaşlanma eşiği
  keyboardStep: 15,            // Klavye yön tuşları hareket adımı

  // Renk ve Form Paleti (Zamanın geçişi renk ve küçülen yarıçapla gösterilir)
  colors: {
    background: '#12131c',
    fresh: '#6366f1',          // Şimdiki zaman / taze iz rengi (Mor/Mavi)
    faded: '#312e81',          // Yaşlanmış / solmuş hafıza rengi (Koyu İndigo)
    cursor: '#ffffff'
  }
};

// ============================================================================
// STATE (ZAMAN VE HAFIZA DURUMU)
// ============================================================================
const state = {
  traces: [],                  // Geçmiş eylemlerin zaman damgalı listesi (Memory Archive)
  isPaused: false,
  keyboardCursor: { x: 400, y: 250, visible: false },
  canvasWidth: 800,
  canvasHeight: 500
};

// DOM Elemanları
const canvas = document.getElementById('temporalityCanvas');
const ctx = canvas.getContext('2d');
const cursorEl = document.getElementById('keyboardCursor');
const traceCountEl = document.getElementById('traceCount');
const stateEl = document.getElementById('temporalState');
const btnPause = document.getElementById('btnPause');
const btnReset = document.getElementById('btnReset');

// ============================================================================
// INPUT (ZAMAN DAMGALI GİRDİ YÖNETİMİ)
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

// Yeni bir zaman izi imprinting (belleğe kaydetme)
function imprintTrace(x, y) {
  if (state.isPaused) return;

  // Bellek kapasitesi dolduysa en eski izi sil (Memory Boundary)
  if (state.traces.length >= DESIGN.maxTraces) {
    state.traces.shift();
  }

  state.traces.push({
    x: x,
    y: y,
    life: 1.0,                 // 1.0 = Taze, 0.0 = Tamamen solmuş
    radius: DESIGN.initialRadius,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4
  });
}

// Fare hareketleri ve tıklamaları
canvas.addEventListener('mousemove', (e) => {
  // Çok sık iz bırakmamak için örnekleme yapabiliriz veya her hareket iz bırakabilir
  if (Math.random() < 0.3) {
    const coords = getCanvasCoords(e);
    imprintTrace(coords.x, coords.y);
  }
});

canvas.addEventListener('click', (e) => {
  const coords = getCanvasCoords(e);
  imprintTrace(coords.x, coords.y);
  // Ekstra güçlü bir iz bırakma
  imprintTrace(coords.x + 5, coords.y + 5);
});

// Dokunmatik Ekran Desteği
canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const coords = getCanvasCoords(e);
  imprintTrace(coords.x, coords.y);
}, { passive: false });

// Klavye Kontrolleri
canvas.addEventListener('keydown', (e) => {
  state.keyboardCursor.visible = true;
  updateCursorPosition();

  switch (e.key) {
    case 'ArrowUp':
      state.keyboardCursor.y = Math.max(10, state.keyboardCursor.y - DESIGN.keyboardStep);
      imprintTrace(state.keyboardCursor.x, state.keyboardCursor.y);
      break;
    case 'ArrowDown':
      state.keyboardCursor.y = Math.min(state.canvasHeight - 10, state.keyboardCursor.y + DESIGN.keyboardStep);
      imprintTrace(state.keyboardCursor.x, state.keyboardCursor.y);
      break;
    case 'ArrowLeft':
      state.keyboardCursor.x = Math.max(10, state.keyboardCursor.x - DESIGN.keyboardStep);
      imprintTrace(state.keyboardCursor.x, state.keyboardCursor.y);
      break;
    case 'ArrowRight':
      state.keyboardCursor.x = Math.min(state.canvasWidth - 10, state.keyboardCursor.x + DESIGN.keyboardStep);
      imprintTrace(state.keyboardCursor.x, state.keyboardCursor.y);
      break;
    case ' ':
    case 'Enter':
      e.preventDefault();
      imprintTrace(state.keyboardCursor.x, state.keyboardCursor.y);
      break;
    case 'p':
    case 'P':
      togglePause();
      break;
    case 'r':
    case 'R':
      resetMemory();
      break;
  }
  updateCursorPosition();
});

btnPause.addEventListener('click', togglePause);
btnReset.addEventListener('click', resetMemory);

function togglePause() {
  state.isPaused = !state.isPaused;
  btnPause.textContent = state.isPaused ? 'Resume Time' : 'Pause Time';
}

function resetMemory() {
  state.traces = [];
  state.isPaused = false;
  btnPause.textContent = 'Pause Time';
}

// ============================================================================
// RULES (ZAMAN VE YAŞLANMA KURALLARI)
// ============================================================================
function updateRules() {
  if (state.isPaused) return;

  // Her karede geçmiş izlerin yaşlanması (Decay rule)
  for (let i = state.traces.length - 1; i >= 0; i--) {
    let trace = state.traces[i];
    trace.life -= DESIGN.decayRate;
    trace.x += trace.vx;
    trace.y += trace.vy;

    // Yaşamı biten izleri hafızadan temizle
    if (trace.life <= 0) {
      state.traces.splice(i, 1);
    }
  }
}

// ============================================================================
// OUTPUT (GÖRSEL ZAMAN DIYAGRAMI VE İZLER)
// ============================================================================
function render() {
  ctx.fillStyle = DESIGN.colors.background;
  ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

  // Geçmiş İzleri Çiz (Ghosting / Memory Decay Output)
  state.traces.forEach((trace) => {
    const currentRadius = trace.radius * trace.life;

    ctx.beginPath();
    ctx.arc(trace.x, trace.y, Math.max(1, currentRadius), 0, Math.PI * 2);
    
    // Yaşlandıkça rengi ve şeffaflığı değişir
    ctx.fillStyle = trace.life > 0.5 ? DESIGN.colors.fresh : DESIGN.colors.faded;
    ctx.globalAlpha = Math.max(0.1, trace.life);
    ctx.fill();

    // Dış halka ile form desteği (Sadece renge bağımlı değil)
    ctx.beginPath();
    ctx.arc(trace.x, trace.y, Math.max(2, currentRadius + 3), 0, Math.PI * 2);
    ctx.strokeStyle = DESIGN.colors.fresh;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1.0; // Opaklığı sıfırla
  });

  // Arayüz Panel Güncellemeleri
  traceCountEl.textContent = state.traces.length;
  stateEl.textContent = state.isPaused ? 'Frozen (Paused)' : 'Flowing (Decaying)';
  stateEl.style.color = state.isPaused ? '#facc15' : '#818cf8';
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

// Ana Zaman Döngüsü (Time Loop)
function loop() {
  updateRules();
  render();
  requestAnimationFrame(loop);
}

loop();