/* ==========================================================================
   SECTOR4 MOTORSPORT // APP LOGIC & INTERACTIONS (v4 - Audio Ignition Fix)
   - Real-Time GT3 Engine RPM Sound Synthesizer (Web Audio API)
   - Nothing Phone Mechanical Piezo Click Audio Synthesizer
   - "Woosh" High-Speed Air / Cloth Swipe Audio Synthesizer
   - Kinetic Telemetry Preloader (Motion Blur Scan Bar + Pure Green & Red Splines)
     Phase 1: Acceleration rises to 25%, then drops
     Phase 2: Acceleration drops, Brake shoots to 100%
     Phase 3: Trail brake decay through corner apex
     Phase 4: Full Acceleration ramps to 100%
   - Interactive Sidebar Navigation with Smooth Scroll & Row Flash Highlighting
   - Smooth Bezier Telemetry Spline Renderer + Interactive Scrubber
   - Fuel Strategy Calculator
   ========================================================================== */

// ---------------------------------------------------------------------------
// 1. Audio Engines (Web Audio API Synthesizers)
// ---------------------------------------------------------------------------
class Sector4AudioSystem {
  constructor() {
    this.ctx = null;
    this.engineNode = null;
    this.engineGain = null;
    this.engineFilter = null;
    this.subNode = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Start continuous GT3 Engine RPM audio loop
  startEngineSound() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Harmonic Sawtooth Oscillator for GT3 Exhaust Drone
    this.engineNode = this.ctx.createOscillator();
    this.engineNode.type = 'sawtooth';
    this.engineNode.frequency.setValueAtTime(95, now); // Idle fundamental ~2800 RPM

    // Sub rumble oscillator for engine body resonance
    this.subNode = this.ctx.createOscillator();
    this.subNode.type = 'triangle';
    this.subNode.frequency.setValueAtTime(48, now);

    // Resonant Lowpass Filter (Induction / Airbox acoustic chamber)
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(320, now);
    this.engineFilter.Q.setValueAtTime(3.2, now);

    // Master Engine Gain
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.0001, now);
    this.engineGain.gain.linearRampToValueAtTime(0.28, now + 0.15); // Smooth fade in

    this.engineNode.connect(this.engineFilter);
    this.subNode.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    this.engineNode.start(now);
    this.subNode.start(now);
  }

  // Modulate engine pitch and induction bite in real-time according to current telemetry RPM
  updateEngineRPM(rpm, throttle) {
    if (!this.ctx || !this.engineNode || !this.engineFilter) return;
    const now = this.ctx.currentTime;

    // Map 2500 - 8500 RPM to fundamental audio frequencies (70Hz to 280Hz)
    const baseFreq = 65 + (rpm / 8500) * 220;
    this.engineNode.frequency.setTargetAtTime(baseFreq, now, 0.035);
    this.subNode.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.035);

    // Filter opens up sharply on throttle application (Induction growl)
    const filterCutoff = 280 + (throttle / 100) * 1100 + (rpm / 8500) * 450;
    this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.035);
  }

  // Smoothly stop engine audio when preloader completes
  stopEngineSound() {
    if (!this.ctx || !this.engineGain) return;
    const now = this.ctx.currentTime;
    this.engineGain.gain.linearRampToValueAtTime(0.0001, now + 0.25);
    setTimeout(() => {
      if (this.engineNode) {
        try { this.engineNode.stop(); this.subNode.stop(); } catch(e){}
        this.engineNode = null;
        this.subNode = null;
      }
    }, 280);
  }

  // Nothing OS Mechanical Piezo Click
  playClick() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2400, now);
    osc1.frequency.exponentialRampToValueAtTime(700, now + 0.025);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.03);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(360, now);
    osc2.frequency.exponentialRampToValueAtTime(90, now + 0.02);
    gain2.gain.setValueAtTime(0.2, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.03);
  }

  // "Woosh" Fast Cloth / Air Swipe Sound
  playWoosh() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const duration = 0.32;

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3.5, now);
    filter.frequency.setValueAtTime(280, now);
    filter.frequency.exponentialRampToValueAtTime(1450, now + duration * 0.42);
    filter.frequency.exponentialRampToValueAtTime(220, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.55, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  }
}

const audioFX = new Sector4AudioSystem();

// ---------------------------------------------------------------------------
// 2. Kinetic Telemetry Preloader (Motion Blur Scan Bar + Engine Sound)
// ---------------------------------------------------------------------------
function initTelemetryPreloader() {
  const overlay = document.getElementById('loader-overlay');
  const canvas = document.getElementById('loaderCanvas');
  if (!canvas || !overlay) return;
  const ctx = canvas.getContext('2d');

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 200 * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = 200;

  let progress = 0;
  const durationMs = 3200; // 3.2 seconds
  const startTime = performance.now();

  const gearElem = document.getElementById('loaderGear');
  const speedElem = document.getElementById('loaderSpeed');
  const rpmElem = document.getElementById('loaderRPM');
  const phaseTextElem = document.getElementById('loaderPhaseText');
  const percentElem = document.getElementById('loaderPercent');
  const progressBar = document.getElementById('loaderProgressBar');

  // Exact 4-Phase Telemetry Profile:
  // Phase 1 (0.00 -> 0.25): Throttle climbs smoothly to 25%, then drops back to 0%
  // Phase 2 (0.25 -> 0.45): Throttle drops, Brake spikes to 100% (Threshold Braking)
  // Phase 3 (0.45 -> 0.65): Trail brake smooth decay down to 0% through corner apex
  // Phase 4 (0.65 -> 1.00): Full Acceleration ramps smoothly up to 100%
  function getTelemetryAt(t) {
    let throttle = 0;
    let brake = 0;
    let speed = 90;
    let gear = '2';
    let rpm = 4200;
    let phase = 'INIT';

    if (t < 0.25) {
      // Phase 1: Throttle rises to 25%, then drops
      const p = t / 0.25;
      throttle = Math.sin(p * Math.PI) * 25;
      brake = 0;
      speed = Math.round(90 + throttle * 0.8);
      gear = '2';
      rpm = Math.round(3800 + throttle * 65);
      phase = '01 INITIAL ACCELERATION [25%] // CORNER ENTRY';
    } else if (t < 0.45) {
      // Phase 2: Accel drops, Brake goes high to 100%
      const p = (t - 0.25) / 0.20;
      throttle = 0;
      brake = Math.sin(p * Math.PI * 0.5) * 100;
      speed = Math.round(110 - p * 45); // 110 -> 65 km/h
      gear = p > 0.6 ? '1' : '2';
      rpm = Math.round(5400 - p * 2400); // 5400 -> 3000
      phase = '02 THRESHOLD BRAKE [ABS PEAK 100%]';
    } else if (t < 0.65) {
      // Phase 3: Trail brake decay down to 0%
      const p = (t - 0.45) / 0.20;
      throttle = Math.sin(p * Math.PI * 0.5) * 8;
      brake = Math.cos(p * Math.PI * 0.5) * 100; // 100 -> 0%
      speed = Math.round(65 + p * 15); // 65 -> 80 km/h
      gear = '1';
      rpm = Math.round(3000 + p * 800);
      phase = '03 TRAIL BRAKE DECAY // APEX MINIMUM SPEED';
    } else {
      // Phase 4: Full acceleration ramps up to 100%
      const p = (t - 0.65) / 0.35;
      throttle = p * p * (3 - 2 * p) * 100;
      brake = 0;
      speed = Math.round(80 + p * 135); // 80 -> 215 km/h
      gear = p > 0.5 ? '3' : '2';
      rpm = Math.round(3800 + p * 4400); // 3800 -> 8200 RPM limiter
      phase = '04 FULL THROTTLE EXTENSION [100%] // GEAR ' + gear;
    }

    return { throttle, brake, speed, gear, rpm, phase };
  }

  // Pre-sample dense points for ultra-smooth spline curve rendering
  const totalSamples = 160;
  const sampledData = [];
  for (let i = 0; i <= totalSamples; i++) {
    const t = i / totalSamples;
    sampledData.push({ t, ...getTelemetryAt(t) });
  }

  function render(time) {
    const elapsed = time - startTime;
    progress = Math.min(1, elapsed / durationMs);

    ctx.clearRect(0, 0, W, H);

    // Dark grid lines
    ctx.strokeStyle = '#121212';
    ctx.lineWidth = 1;
    for (let y = 20; y < H; y += 35) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    for (let x = 40; x < W; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    const curX = progress * W;
    const visibleIndex = Math.floor(progress * totalSamples);

    if (visibleIndex > 1) {
      // 1. Ultra-smooth Pure Green Throttle Curve (#00FF66)
      ctx.beginPath();
      ctx.strokeStyle = '#00FF66';
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#00FF66';
      ctx.shadowBlur = 8;

      ctx.moveTo(0, H - (sampledData[0].throttle / 100) * (H - 45) - 20);
      for (let i = 1; i <= visibleIndex; i++) {
        const prev = sampledData[i - 1];
        const cur = sampledData[i];
        const x1 = prev.t * W;
        const y1 = H - (prev.throttle / 100) * (H - 45) - 20;
        const x2 = cur.t * W;
        const y2 = H - (cur.throttle / 100) * (H - 45) - 20;
        const xc = (x1 + x2) / 2;
        const yc = (y1 + y2) / 2;
        ctx.quadraticCurveTo(x1, y1, xc, yc);
      }
      ctx.stroke();

      // 2. Ultra-smooth Pure Red Brake Curve (#FF2233)
      ctx.beginPath();
      ctx.strokeStyle = '#FF2233';
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#FF2233';
      ctx.shadowBlur = 8;

      ctx.moveTo(0, H - (sampledData[0].brake / 100) * (H - 45) - 20);
      for (let i = 1; i <= visibleIndex; i++) {
        const prev = sampledData[i - 1];
        const cur = sampledData[i];
        const x1 = prev.t * W;
        const y1 = H - (prev.brake / 100) * (H - 45) - 20;
        const x2 = cur.t * W;
        const y2 = H - (cur.brake / 100) * (H - 45) - 20;
        const xc = (x1 + x2) / 2;
        const yc = (y1 + y2) / 2;
        ctx.quadraticCurveTo(x1, y1, xc, yc);
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // reset blur
    }

    // 3. Motion Blur Scan Bar Effect:
    const ghostCount = 7;
    const ghostTrailWidth = 26;
    for (let g = ghostCount; g >= 1; g--) {
      const ghostOffset = (g / ghostCount) * ghostTrailWidth;
      const gx = curX - ghostOffset;
      if (gx >= 0) {
        const alpha = Math.pow(1 - (g / ghostCount), 1.8) * 0.42;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, H);
        ctx.stroke();
      }
    }

    // Primary Leading Needle
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.2;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(curX, 0);
    ctx.lineTo(curX, H);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Real-Time HUD Updates
    const curData = getTelemetryAt(progress);
    if (gearElem) gearElem.innerHTML = `GEAR <strong>${curData.gear}</strong>`;
    if (speedElem) speedElem.innerHTML = `SPEED <strong>${curData.speed} KM/H</strong>`;
    if (rpmElem) rpmElem.innerHTML = `RPM <strong>${curData.rpm}</strong>`;
    if (phaseTextElem) phaseTextElem.textContent = curData.phase;
    if (percentElem) percentElem.textContent = `${Math.round(progress * 100)}%`;
    if (progressBar) progressBar.style.width = `${progress * 100}%`;

    // Modulate real-time GT3 engine sound
    audioFX.updateEngineRPM(curData.rpm, curData.throttle);

    if (progress < 1) {
      requestAnimationFrame(render);
    } else {
      // Finished
      audioFX.stopEngineSound();
      setTimeout(() => {
        overlay.classList.add('slide-out-left');
        document.body.classList.remove('loading-active');
        audioFX.playWoosh();
        triggerHeroTextReveal();
      }, 240);
    }
  }

  requestAnimationFrame(render);
}

// ---------------------------------------------------------------------------
// 3. Hero Big Text Kinetic Reveal Animation
// ---------------------------------------------------------------------------
function triggerHeroTextReveal() {
  const title = document.getElementById('mainBlockTitle');
  const sub = document.querySelector('.block-subtitle');
  const tag = document.querySelector('.hero-tagline');
  const actions = document.querySelector('.hero-center-actions');
  const desc = document.querySelector('.hero-desc-centered');

  if (title) title.classList.add('revealed');
  if (sub) sub.classList.add('revealed');
  if (tag) tag.classList.add('revealed');
  if (actions) actions.classList.add('revealed');
  if (desc) desc.classList.add('revealed');
}

// ---------------------------------------------------------------------------
// 4. Interactive Navigation & Section Highlighting with Ignition Launch
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const startScreen = document.getElementById('loaderStartScreen');
  const loaderContent = document.getElementById('loaderContent');
  let started = false;

  function launchExperience() {
    if (started) return;
    started = true;

    // 1. Explicitly unlock & resume audio context and start GT3 engine rumble
    audioFX.init();
    audioFX.startEngineSound();

    // 2. Hide ignition screen, reveal telemetry HUD, and launch preloader
    if (startScreen) startScreen.style.display = 'none';
    if (loaderContent) loaderContent.style.display = 'flex';

    initTelemetryPreloader();
  }

  // If startScreen exists, wait for user click/touch or keypress (Autoplay Compliance)
  if (startScreen) {
    startScreen.addEventListener('click', launchExperience);
    startScreen.addEventListener('touchstart', launchExperience, { passive: true });
    document.addEventListener('keydown', launchExperience, { once: true });
  } else {
    // Fallback: If no start screen overlay, start directly
    initTelemetryPreloader();
  }

  // Navigation Links click handler (Right Dock & CTA Buttons)
  const navButtons = document.querySelectorAll('.nav-link-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-target');
      if (!targetId) return;

      const targetElem = document.getElementById(targetId);
      if (targetElem) {
        audioFX.playWoosh();

        navButtons.forEach(b => b.classList.remove('dock-active'));
        if (btn.classList.contains('dock-item')) {
          btn.classList.add('dock-active');
        }

        targetElem.scrollIntoView({ behavior: 'smooth', block: 'center' });

        if (targetElem.classList.contains('table-row')) {
          targetElem.classList.add('row-highlight');
          setTimeout(() => {
            targetElem.classList.remove('row-highlight');
          }, 1800);
        }
      }
    });
  });

  // Attach mechanical click sound to all standard buttons
  const soundButtons = document.querySelectorAll('.sound-btn:not(.nav-link-btn)');
  soundButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      audioFX.playClick();
    });
  });

  // Discord Copy Invite button
  const copyBtn = document.getElementById('copyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      audioFX.playClick();
      navigator.clipboard.writeText('https://discord.gg/SvsFxPD3V').then(() => {
        const orig = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span style="color:#00FF66;font-size:11px;font-family:monospace">COPIED</span>';
        setTimeout(() => { copyBtn.innerHTML = orig; }, 1500);
      });
    });
  }

  initTelemetryCanvas();
  initFuelCalculator();
});

// ---------------------------------------------------------------------------
// 5. Smooth Bezier Telemetry Spline Renderer (Paddock Section)
// ---------------------------------------------------------------------------
function initTelemetryCanvas() {
  const canvas = document.getElementById('telemetryCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 220 * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = 220;

  const telemetryData = [
    { x: 0.00, throttle: 25,  brake: 0,   speed: 100 },
    { x: 0.12, throttle: 25,  brake: 0,   speed: 105 },
    { x: 0.22, throttle: 0,   brake: 30,  speed: 102 },
    { x: 0.32, throttle: 0,   brake: 100, speed: 78  }, // Hard threshold brake
    { x: 0.44, throttle: 0,   brake: 65,  speed: 68  },
    { x: 0.54, throttle: 5,   brake: 20,  speed: 65  }, // Trail brake
    { x: 0.62, throttle: 25,  brake: 0,   speed: 72  }, // Apex exit
    { x: 0.75, throttle: 65,  brake: 0,   speed: 110 },
    { x: 0.88, throttle: 100, brake: 0,   speed: 175 },
    { x: 1.00, throttle: 100, brake: 0,   speed: 215 }
  ];

  let scrubX = 0.62 * W;

  function drawTelemetry(activeX) {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#141414';
    ctx.lineWidth = 1;

    for (let y = 30; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    for (let x = 60; x < W; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    function drawSpline(metric, color, maxVal, lineWidth) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const pts = telemetryData.map(d => ({
        x: d.x * W,
        y: H - (d[metric] / maxVal) * (H - 45) - 20
      }));
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 0; i < pts.length - 1; i++) {
        const xc = (pts[i].x + pts[i + 1].x) / 2;
        const yc = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
    }

    drawSpline('speed', 'rgba(255, 255, 255, 0.4)', 260, 1.5);
    drawSpline('brake', '#FF2233', 100, 2.8);
    drawSpline('throttle', '#00FF66', 100, 2.8);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(activeX, 0);
    ctx.lineTo(activeX, H);
    ctx.stroke();
    ctx.setLineDash([]);

    const normX = Math.max(0, Math.min(1, activeX / W));
    let p1 = telemetryData[0];
    let p2 = telemetryData[telemetryData.length - 1];

    for (let i = 0; i < telemetryData.length - 1; i++) {
      if (normX >= telemetryData[i].x && normX <= telemetryData[i + 1].x) {
        p1 = telemetryData[i];
        p2 = telemetryData[i + 1];
        break;
      }
    }

    const ratio = p2.x === p1.x ? 0 : (normX - p1.x) / (p2.x - p1.x);
    document.getElementById('valThrottle').textContent = `${Math.round(p1.throttle + ratio * (p2.throttle - p1.throttle))}%`;
    document.getElementById('valBrake').textContent = `${Math.round(p1.brake + ratio * (p2.brake - p1.brake))}%`;
    document.getElementById('valSpeed').textContent = `${Math.round(p1.speed + ratio * (p2.speed - p1.speed))} km/h`;
  }

  drawTelemetry(scrubX);

  function handleMove(e) {
    const bound = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    scrubX = Math.max(0, Math.min(W, clientX - bound.left));
    drawTelemetry(scrubX);
  }

  canvas.addEventListener('mousemove', handleMove);
  canvas.addEventListener('touchmove', handleMove, { passive: true });
}

// ---------------------------------------------------------------------------
// 6. Fuel Strategy Calculator
// ---------------------------------------------------------------------------
function initFuelCalculator() {
  const btn = document.getElementById('btnCalculateFuel');
  if (!btn) return;

  function calculate() {
    audioFX.playClick();
    const hours = parseInt(document.getElementById('fuelHours').value, 10) || 0;
    const minutes = parseInt(document.getElementById('fuelMinutes').value, 10) || 0;
    const seconds = parseInt(document.getElementById('fuelSeconds').value, 10) || 0;

    const totalRaceDurationSec = (hours * 3600) + (minutes * 60) + seconds;
    const lapMin = parseInt(document.getElementById('lapMin').value, 10) || 0;
    const lapSec = parseInt(document.getElementById('lapSec').value, 10) || 0;
    const lapMs = parseInt(document.getElementById('lapMs').value, 10) || 0;

    const lapTimeSec = (lapMin * 60) + lapSec + (lapMs / 1000);
    const fuelPerLap = parseFloat(document.getElementById('fuelPerLap').value) || 2.85;
    const bufferLaps = parseInt(document.getElementById('fuelBuffer').value, 10) || 1;

    if (totalRaceDurationSec <= 0 || lapTimeSec <= 10) {
      document.getElementById('resExplanation').textContent = 'Please enter a valid race duration and lap time.';
      return;
    }

    const totalLaps = Math.ceil(totalRaceDurationSec / lapTimeSec);
    const minFuel = (totalLaps * fuelPerLap).toFixed(1);
    const safeFuel = ((totalLaps + bufferLaps) * fuelPerLap).toFixed(1);

    document.getElementById('resMinFuel').textContent = `${minFuel} L`;
    document.getElementById('resSafeFuel').textContent = `${safeFuel} L`;
    document.getElementById('resTotalLaps').textContent = `${totalLaps} Laps`;

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');

    document.getElementById('resExplanation').textContent = 
      `For a ${hh}:${mm}:${ss} race at ${fuelPerLap} L/lap, you need ${minFuel} L for ${totalLaps} laps. Safe fuel adds ${bufferLaps} buffer lap(s) to cover formation and overtime.`;
  }

  btn.addEventListener('click', calculate);
  calculate();
}