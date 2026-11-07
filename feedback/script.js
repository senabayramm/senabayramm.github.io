// ============================================================================
// DESIGN CONFIGURATION (TASARIM YAPILANDIRMASI)
// Bu nesne, ısı ataleti (inertia), gecikme ve görsel geri bildirim parametrelerini belirler.
// ============================================================================
const DESIGN = {
  targetTemp: 50.0,            // İdeal denge hedef sıcaklığı (°C)
  ambientTemp: 20.0,           // Oda/çevre sıcaklığı (°C)
  thermalInertia: 0.94,        // Isıl atalet katsayısı (1'e yaklaştıkça sistem daha yavaş tepki verir)
  heatImpulse: 2.5,            // Isıtma tuşunun ürettiği ivme
  coolImpulse: -2.5,           // Soğutma tuşunun ürettiği ivme
  dissipationRate: 0.005,      // Çevreye ısı yayılım oranı
  maxTemp: 100.0,              // Maksimum sıcaklık sınırı
  minTemp: 0.0,                // Minimum sıcaklık sınırı

  // Renk ve Form Paleti (Sadece renkle değil, halka yarıçapı ve dalga yüksekliği ile de geri bildirim)
  colors: {
    background: '#12141d',
    cold: '#38bdf8',           // Soğuk durum rengi (Mavi)
    optimal: '#22c55e',        // Dengeli/İdeal durum rengi (Yeşil)
    hot: '#ef4444',            // Sıcak durum rengi (Kırmızı)
    targetZone: 'rgba(34, 197, 94, 0.15)'
  }
};

// ============================================================================
// STATE (SİSTEMİN GİZLİ VE AÇIK DURUMU)
// ============================================================================
const state = {
  currentTemp: 20.0,           // Sistemin anlık görünür sıcaklığı
  momentum: 0.0,               // GİZLİ DURUM: Isı ataleti/momentum (Görsel ok/vektör ile görünür kılınır)
  history: [],                 // Geri bildirim grafiği için geçmiş kayıtlar
  isPaused: false,
  canvasWidth: 800,
  canvasHeight: 500
};

// DOM Elemanları
const canvas = document.getElementById('feedbackCanvas');
const ctx = canvas.getContext('2d');
const tempEl = document.getElementById('tempDisplay');
const momentumEl = document.getElementById('momentumDisplay');
const stateEl = document.getElementById('systemState');
const btnHeat = document.getElementById('btnHeat');
const btnCool = document.getElementById('btnCool');
const btnPause = document.getElementById('btnPause');
const btnReset = document.getElementById('btnReset');

// ============================================================================
// INPUT (GİRDİ YÖNETİMİ)
// ============================================================================
function applyThermalImpulse(amount) {
  if (state.isPaused) return;
  // Eylemin kendisi anında sıcaklığı değiştirmez, gizli momentumu artırır (Atalet Kuralı)
  state.momentum += amount;
}

// Fare / Touch Kontrolleri
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const clickY = e.clientY - rect.top;
  if (clickY < canvas.height / 2) {
    applyThermalImpulse(DESIGN.heatImpulse);
  } else {
    applyThermalImpulse(DESIGN.coolImpulse);
  }
});

btnHeat.addEventListener('click', () => applyThermalImpulse(DESIGN.heatImpulse));
btnCool.addEventListener('click', () => applyThermalImpulse(DESIGN.coolImpulse));

// Klavye Kontrolleri
document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp':
    case 'ArrowRight':
      applyThermalImpulse(DESIGN.heatImpulse);
      break;
    case 'ArrowDown':
    case 'ArrowLeft':
      applyThermalImpulse(DESIGN.coolImpulse);
      break;
    case 'p':
    case 'P':
      togglePause();
      break;
    case 'r':
    case 'R':
      resetSystem();
      break;
  }
});

btnPause.addEventListener('click', togglePause);
btnReset.addEventListener('click', resetSystem);

function togglePause() {
  state.isPaused = !state.isPaused;
  btnPause.textContent = state.isPaused ? 'Resume Simulation' : 'Pause Simulation';
}

function resetSystem() {
  state.currentTemp = DESIGN.ambientTemp;
  state.momentum = 0.0;
  state.history = [];
  state.isPaused = false;
  btnPause.textContent = 'Pause Simulation';
}

// ============================================================================
// RULES (GİZLİ DURUM & ATALET KURALLARI)
// ============================================================================
function updateRules() {
  if (state.isPaused) return;

  // 1. Kural: Momentum zamanla sıcaklığa aktarılır (Thermal Inertia)
  state.currentTemp += state.momentum * (1 - DESIGN.thermalInertia);

  // 2. Kural: Sürtünme ve Doğal Isı Dağılımı
  state.momentum *= DESIGN.thermalInertia;
  state.currentTemp -= (state.currentTemp - DESIGN.ambientTemp) * DESIGN.dissipationRate;

  // Sınırlandırma
  state.currentTemp = Math.max(DESIGN.minTemp, Math.min(DESIGN.maxTemp, state.currentTemp));

  // Geçmiş Sıcaklık Kaydı (Feedback Loop Grafiği İçin)
  state.history.push(state.currentTemp);
  if (state.history.length > 150) {
    state.history.shift();
  }
}

// ============================================================================
// OUTPUT (GÖRSEL GERİ BİLDİRİM VE DÖNGÜ GÖRSELLEŞTİRMESİ)
// ============================================================================
function render() {
  ctx.fillStyle = DESIGN.colors.background;
  ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

  // Sıcaklık Seviyesine Göre Dinamik Renk Hesabı
  const tempRatio = state.currentTemp / DESIGN.maxTemp;
  let currentColor = DESIGN.colors.optimal;
  if (state.currentTemp < DESIGN.targetTemp - 10) currentColor = DESIGN.colors.cold;
  if (state.currentTemp > DESIGN.targetTemp + 10) currentColor = DESIGN.colors.hot;

  // 1. Hedef Bölge (Optimal Feedback Zone)
  const targetY = state.canvasHeight - (DESIGN.targetTemp / DESIGN.maxTemp) * state.canvasHeight;
  ctx.fillStyle = DESIGN.colors.targetZone;
  ctx.fillRect(0, targetY - 20, state.canvasWidth, 40);

  // 2. Sıcaklık Geçmiş Grafiği (Feedback Curve)
  ctx.beginPath();
  ctx.strokeStyle = currentColor;
  ctx.lineWidth = 3;
  for (let i = 0; i < state.history.length; i++) {
    const x = (i / 150) * state.canvasWidth;
    const y = state.canvasHeight - (state.history[i] / DESIGN.maxTemp) * state.canvasHeight;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // 3. GİZLİ DURUMUN GÖRÜNÜR KILINMASI: Momentum Vektörü (Atalet Oku)
  const currentY = state.canvasHeight - (state.currentTemp / DESIGN.maxTemp) * state.canvasHeight;
  const cursorX = state.canvasWidth - 100;

  ctx.beginPath();
  ctx.arc(cursorX, currentY, 12, 0, Math.PI * 2);
  ctx.fillStyle = currentColor;
  ctx.fill();

  // Momentum Vektör Oku (Gizli İvmenin Yönü ve Şiddeti)
  if (Math.abs(state.momentum) > 0.05) {
    const arrowLength = state.momentum * 15;
    ctx.beginPath();
    ctx.moveTo(cursorX, currentY);
    ctx.lineTo(cursorX, currentY - arrowLength);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  // DOM Panel Güncellemesi
  tempEl.textContent = `${state.currentTemp.toFixed(1)}°C`;
  momentumEl.textContent = state.momentum.toFixed(2);
  
  if (Math.abs(state.currentTemp - DESIGN.targetTemp) < 5) {
    stateEl.textContent = 'Optimal Equilibrium';
    stateEl.style.color = DESIGN.colors.optimal;
  } else if (state.currentTemp < DESIGN.targetTemp) {
    stateEl.textContent = 'Under-heated';
    stateEl.style.color = DESIGN.colors.cold;
  } else {
    stateEl.textContent = 'Over-heated';
    stateEl.style.color = DESIGN.colors.hot;
  }
}

// Ana Döngü
function loop() {
  updateRules();
  render();
  requestAnimationFrame(loop);
}

loop();