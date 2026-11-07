// ============================================================================
// DESIGN CONFIGURATION (TASARIM YAPILANDIRMASI)
// Bu nesne üzerindeki parametreler sistemin kurallarını ve sınırlarını belirler.
// ============================================================================
const DESIGN = {
  // Görsel ve Boyut Ayarları
  maxOrganisms: 60,            // Ekosistemin taşıyabileceği maksimum canlı sayısı (Performans & Sınır kuralı)
  initialRadius: 8,            // Yeni doğan canlıların başlangıç yarıçapı (piksel)
  maxRadius: 28,               // Canlıların ulaşabileceği maksimum büyüklük
  growthRate: 0.05,            // Canlıların kare başına büyüme hızı

  // Fiziksel & Mantıksal Kurallar
  repulsionForce: 0.4,         // Canlıların birbirini itme kuvveti
  decayRate: 0.02,             // Yaşlandıkça küçülme/sönümlenme hızı
  overcrowdThreshold: 35,      // Aşırı nüfus eşiği (Sistem durumunu "Chaotic" yapar)

  // Klavye Navigasyon Hızı
  keyboardStep: 15,            // Klavye yön tuşları imleç hareket adımı (piksel)

  // Renk Kodları (Renk dışında form ve boyut ile de durum temsil edilir)
  colors: {
    background: '#18181b',
    normal: '#00b37e',         // Dengeli durum rengi (Yeşil tonu)
    crowded: '#fba94c',        // Kalabalık durum rengi (Turuncu tonu)
    cursor: '#ffffff'
  }
};

// ============================================================================
// STATE (SİSTEM DURUMU)
// Sistemin anlık verilerini ve canlıların listesini tutar.
// ============================================================================
const state = {
  organisms: [],
  isPaused: false,
  keyboardCursor: { x: 400, y: 250, visible: false },
  canvasWidth: 800,
  canvasHeight: 500
};

// Canvas & DOM Elemanları
const canvas = document.getElementById('ecosystemCanvas');
const ctx = canvas.getContext('2d');
const cursorEl = document.getElementById('keyboardCursor');
const countEl = document.getElementById('organismCount');
const stateEl = document.getElementById('systemState');
const btnPause = document.getElementById('btnPause');
const btnReset = document.getElementById('btnReset');

// ============================================================================
// INPUT (GİRDİ MANTIGI)
// Katılımcı eylemlerini yakalar ve sistem durumuna aktarır.
// ============================================================================

// Fare veya Dokunma Konumunu Canvas Koordinatına Çevirme
function getCanvasCoords(event) {
  const rect = canvas.getBoundingClientRect();
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height)
  };
}

// Ekosisteme Yeni Canlı/Enerji Ekleme
function injectEnergy(x, y) {
  // Tasarım kuralı: Maksimum kapasiteye ulaşıldıysa en eski canlı silinir
  if (state.organisms.length >= DESIGN.maxOrganisms) {
    state.organisms.shift();
  }

  state.organisms.push({
    x: x,
    y: y,
    radius: DESIGN.initialRadius,
    vx: (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 1.5,
    pulse: Math.random() * Math.PI
  });
}

// Fare Tıklaması
canvas.addEventListener('click', (e) => {
  const coords = getCanvasCoords(e);
  injectEnergy(coords.x, coords.y);
});

// Dokunmatik Ekran Desteği
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const coords = getCanvasCoords(e);
  injectEnergy(coords.x, coords.y);
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
      injectEnergy(state.keyboardCursor.x, state.keyboardCursor.y);
      break;
    case 'p':
    case 'P':
      togglePause();
      break;
  }
  updateCursorPosition();
});

// Duraklatma & Sıfırlama Buton Dinleyicileri
btnPause.addEventListener('click', togglePause);
btnReset.addEventListener('click', resetEcosystem);

function togglePause() {
  state.isPaused = !state.isPaused;
  btnPause.textContent = state.isPaused ? 'Resume' : 'Pause';
}

function resetEcosystem() {
  state.organisms = [];
  state.isPaused = false;
  btnPause.textContent = 'Pause';
}

// ============================================================================
// RULES (SİSTEM KURALLARI VE FİZİK)
// Tasarımcının koyduğu kurallar doğrultusunda canlıların davranışını günceller.
// ============================================================================
function updateRules() {
  if (state.isPaused) return;

  for (let i = 0; i < state.organisms.length; i++) {
    const org = state.organisms[i];

    // 1. Kural: Büyüme ve Atım (Pulse) Mantığı
    if (org.radius < DESIGN.maxRadius) {
      org.radius += DESIGN.growthRate;
    }
    org.pulse += 0.05;

    // 2. Kural: Ekran Sınırlarından Sekme
    org.x += org.vx;
    org.y += org.vy;

    if (org.x - org.radius < 0 || org.x + org.radius > state.canvasWidth) org.vx *= -1;
    if (org.y - org.radius < 0 || org.y + org.radius > state.canvasHeight) org.vy *= -1;

    // 3. Kural: Canlıların Birbirini İtmesi (İtiş Gücü)
    for (let j = i + 1; j < state.organisms.length; j++) {
      const other = state.organisms[j];
      const dx = other.x - org.x;
      const dy = other.y - org.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDist = org.radius + other.radius;

      if (distance < minDist && distance > 0) {
        const overlap = minDist - distance;
        const nx = dx / distance;
        const ny = dy / distance;

        org.x -= nx * overlap * 0.5 * DESIGN.repulsionForce;
        org.y -= ny * overlap * 0.5 * DESIGN.repulsionForce;
        other.x += nx * overlap * 0.5 * DESIGN.repulsionForce;
        other.y += ny * overlap * 0.5 * DESIGN.repulsionForce;
      }
    }
  }
}

// ============================================================================
// OUTPUT (GÖRSEL VE ARAYÜZ ÇIKTISI)
// Sistemin son durumunu tuvale çizer ve paneldeki metinleri günceller.
// ============================================================================
function render() {
  // Arka planı temizle
  ctx.fillStyle = DESIGN.colors.background;
  ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

  const isOvercrowded = state.organisms.length > DESIGN.overcrowdThreshold;
  const activeColor = isOvercrowded ? DESIGN.colors.crowded : DESIGN.colors.normal;

  // Canlıları Çiz
  state.organisms.forEach((org) => {
    const currentRadius = org.radius + Math.sin(org.pulse) * 1.5;

    ctx.beginPath();
    ctx.arc(org.x, org.y, Math.max(2, currentRadius), 0, Math.PI * 2);
    ctx.fillStyle = activeColor;
    ctx.fill();

    // Dış Halka (Sadece renk değil, form desteği için)
    ctx.beginPath();
    ctx.arc(org.x, org.y, Math.max(4, currentRadius + 4), 0, Math.PI * 2);
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Arayüz Metinlerini Güncelle
  countEl.textContent = state.organisms.length;
  stateEl.textContent = isOvercrowded ? 'High Density (Crowded)' : 'Balanced';
  stateEl.style.color = isOvercrowded ? DESIGN.colors.crowded : DESIGN.colors.normal;
}

// Klavye İmlecini Gösterme/Yerleştirme
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

// Ana Döngü (Game Loop)
function loop() {
  updateRules();
  render();
  requestAnimationFrame(loop);
}

// Başlatma
loop();