/* ==========================================================================
   SECTOR4 MOTORSPORT // APP LOGIC & INTERACTIONS (v4)
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

  // Layered four-stroke cross-plane V8 impression, generated locally with Web Audio.
  // Four exhaust events per crankshaft revolution, with a second bank slightly offset.
  // No prerecorded samples or third-party assets.
  startEngineSound() {
    this.init();
    if (!this.ctx || this.engineGain) return;
    const now = this.ctx.currentTime;
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.0001, now);
    this.engineGain.gain.linearRampToValueAtTime(0.20, now + 0.12);
    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.13;
    const bodyFilter = this.ctx.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    bodyFilter.frequency.value = 420;
    bodyFilter.Q.value = 0.65;
    this.engineFilter = bodyFilter;
    this.engineGain.connect(compressor);
    compressor.connect(this.ctx.destination);
    bodyFilter.connect(this.engineGain);
    this.v8Nodes = [];
    // Cross-plane-style uneven per-bank pulse energy; combined banks have eight cylinders.
    const banks = [
      { shape: 'sawtooth', phase: 0, volume: 0.46 },
      { shape: 'triangle', phase: 0.42, volume: 0.30 },
      { shape: 'sawtooth', phase: 0.76, volume: 0.20 },
      { shape: 'sine', phase: 0, volume: 0.24 },
    ];
    for (let i = 0; i < banks.length; i++) {
      const bank = banks[i];
      const osc = this.ctx.createOscillator();
      const vol = this.ctx.createGain();
      osc.type = bank.shape;
      osc.frequency.setValueAtTime(i === 3 ? 47 : 90, now);
      vol.gain.value = bank.volume;
      osc.connect(vol);
      vol.connect(bodyFilter);
      osc.start(now);
      this.v8Nodes.push({osc, vol, multiplier: i === 3 ? 0.5 : 1 + bank.phase * 0.025});
    }
    // Airbox hiss adds texture as throttle opens.
    const sampleCount = Math.max(1024, Math.floor(this.ctx.sampleRate * 0.4));
    const noiseBuffer = this.ctx.createBuffer(1, sampleCount, this.ctx.sampleRate);
    const samples = noiseBuffer.getChannelData(0);
    for (let i=0; i<sampleCount; i++) samples[i] = (Math.random() * 2 - 1) * 0.42;
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 680;
    noiseFilter.Q.value = 0.6;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = 0.015;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(bodyFilter);
    noise.start(now);
    this.v8Noise = {noise, noiseGain, noiseFilter};
  }

  updateEngineRPM(rpm, throttle) {
    if (!this.ctx || !this.engineGain || !this.v8Nodes) return;
    const now = this.ctx.currentTime;
    const safeRpm = Math.min(8500, Math.max(1500, Number(rpm) || 2500));
    const safeThrottle = Math.min(100, Math.max(0, Number(throttle) || 0));
    // A four-stroke eight-cylinder engine fires four times per revolution.
    const firingHz = (safeRpm / 60) * 4;
    // Divide for a lower growl; higher partials rebuild the V8 exhaust character.
    const baseHz = firingHz / 3.5;
    this.v8Nodes.forEach((node, i) => {
      const multiplier = i === 3 ? 0.5 : [1, 1.99, 2.99][i];
      node.osc.frequency.setTargetAtTime(baseHz * multiplier, now, 0.045);
      node.vol.gain.setTargetAtTime((i === 0 ? 0.44 : i === 1 ? 0.27 : i === 2 ? 0.13 : 0.27) * (0.7 + safeThrottle / 250), now, 0.06);
    });
    this.engineFilter.frequency.setTargetAtTime(280 + (safeRpm / 8500) * 1300 + safeThrottle * 11, now, 0.055);
    if (this.v8Noise) {
      this.v8Noise.noiseGain.gain.setTargetAtTime(0.008 + safeThrottle * 0.0003, now, 0.06);
      this.v8Noise.noiseFilter.frequency.setTargetAtTime(400 + safeRpm * 0.1, now, 0.07);
    }
  }

  stopEngineSound() {
    if (!this.ctx || !this.engineGain) return;
    const gain = this.engineGain;
    const nodes = this.v8Nodes || [];
    const noise = this.v8Noise;
    this.engineGain = null;
    this.v8Nodes = null;
    this.v8Noise = null;
    gain.gain.cancelScheduledValues(this.ctx.currentTime);
    gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.065);
    setTimeout(() => {
      nodes.forEach(({osc}) => {try { osc.stop(); } catch (_) {} });
      if (noise) {try { noise.noise.stop(); } catch (_) {} }
      try {gain.disconnect();} catch (_) {}
    }, 360);
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
  const audio = document.getElementById('v8Recording');
  if (!overlay || !audio) return;
  const startBtn = document.getElementById('startV8');
  const showBtn = document.getElementById('showSite');
  const revBtn = document.getElementById('revIt');
  const skipBtn = document.getElementById('skipIntro');
  const needle = document.getElementById('tachNeedle');
  const digital = document.getElementById('digitalRPM');
  const stage = document.getElementById('tachAssembly');
  const phase = document.getElementById('loaderPhaseText');
  const progress = document.getElementById('loaderProgressBar');
  const pct = document.getElementById('loaderPercent');
  const status = document.getElementById('cockpitStatus');
  const engineState = document.getElementById('engineState');
  const revMode = document.getElementById('revMode');
  const clock = document.getElementById('audioClock');
  const ignition = document.getElementById('ignitionStep');
  const starter = document.getElementById('starterStep');
  const idle = document.getElementById('idleStep');
  const canvas = document.getElementById('engineWaveform');
  const ctx = canvas?.getContext('2d');
  const duration = 9.528;
  const revStart = 3.88;
  const envelope = [0.0, 0.022, 0.033, 0.033, 0.033, 0.029, 0.032, 0.05, 0.054, 0.028, 0.033, 0.025, 0.031, 0.036, 0.035, 0.023, 0.198, 0.124, 0.083, 0.09, 0.09, 0.098, 0.089, 0.168, 0.114, 0.164, 0.114, 0.234, 0.365, 0.308, 0.329, 0.377, 0.373, 0.321, 0.23, 0.216, 0.156, 0.146, 0.199, 0.195, 0.151, 0.129, 0.136, 0.101, 0.103, 0.066, 0.077, 0.087, 0.071, 0.047, 0.06, 0.048, 0.066, 0.061, 0.057, 0.071, 0.062, 0.079, 0.073, 0.081, 0.087, 0.078, 0.082, 0.077, 0.069, 0.082, 0.083, 0.079, 0.149, 0.207, 0.281, 0.394, 0.482, 0.6, 1.0, 0.765, 0.764, 0.877, 0.728, 0.52, 0.629, 0.819, 0.686, 0.819, 0.537, 0.549, 0.565, 0.528, 0.56, 0.56, 0.545, 0.572, 0.583, 0.37, 0.31, 0.365, 0.377, 0.33, 0.365, 0.371, 0.333, 0.414, 0.216, 0.164, 0.172, 0.132, 0.192, 0.18, 0.143, 0.126, 0.118, 0.121, 0.104, 0.09, 0.176, 0.187, 0.206, 0.459, 0.421, 0.664, 0.699, 0.654, 0.794, 0.728, 0.566, 0.608, 0.668, 0.734, 0.73, 0.64, 0.496, 0.531, 0.583, 0.541, 0.536, 0.579, 0.586, 0.518, 0.478, 0.355, 0.331, 0.346, 0.372, 0.329, 0.35, 0.344, 0.34, 0.269, 0.29, 0.276, 0.246, 0.196, 0.142, 0.15, 0.18, 0.141, 0.114, 0.114, 0.008];
  const peaks = [
    [0.0, 0], [0.55, 0], [1.15, 220], [1.55, 750], [1.85, 1300],
    [2.15, 1050], [2.75, 850], [3.80, 920], [4.15, 1800],
    [4.45, 5400], [4.80, 6150], [5.15, 5700], [5.50, 4200],
    [6.15, 2100], [6.65, 950], [6.95, 1700], [7.25, 5200],
    [7.50, 6100], [7.85, 5700], [8.20, 4200], [8.70, 2600],
    [9.25, 1050], [9.528, 850]
  ];
  // These RPM estimates are visual cues matched to the recording's envelope,
  // not measured data. The MP3 does not contain real RPM telemetry.
  function rpmAt(t) {
    if (t <= 0.55) return 0;
    for (let i = 1; i < peaks.length; i++) {
      if (t <= peaks[i][0]) {
        const [t0,r0] = peaks[i - 1], [t1,r1] = peaks[i];
        const x = Math.max(0, Math.min(1, (t-t0)/(t1-t0)));
        const smooth = x*x*(3-2*x);
        return Math.round(r0+(r1-r0)*smooth);
      }
    }
    return 850;
  }
  const ticks = document.getElementById('tachTicks');
  const nums = document.getElementById('tachNumbers');
  for (let n=0; n<=70; n++) {
    const a=(-140 + n*280/70)*Math.PI/180;
    const major=n%10===0, r1=major?132:140, r2=151;
    const line=document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',180+Math.sin(a)*r1);line.setAttribute('y1',180-Math.cos(a)*r1);
    line.setAttribute('x2',180+Math.sin(a)*r2);line.setAttribute('y2',180-Math.cos(a)*r2);
    line.setAttribute('stroke', n>=60?'#ff5c00':major?'#eee':'#595959');
    line.setAttribute('stroke-width',major?'3':'1.5');ticks.appendChild(line);
    if (major) {
      const txt=document.createElementNS('http://www.w3.org/2000/svg','text');
      txt.setAttribute('x',180+Math.sin(a)*111);txt.setAttribute('y',185-Math.cos(a)*111);
      txt.setAttribute('fill',n>=60?'#ff5c00':'#d0d0d0');
      txt.setAttribute('text-anchor','middle');txt.setAttribute('font-size','18');
      txt.setAttribute('font-family','JetBrains Mono,monospace');txt.setAttribute('font-weight','700');
      txt.textContent=String(n/10);nums.appendChild(txt);
    }
  }
  let started = false, revOnly = false, animationId = 0, finished = false;
  function setStep(el,active){ el?.classList.toggle('active',active); }
  function drawWaveform(time) {
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio||1,1.5);
    const width = Math.max(1,canvas.clientWidth), height = Math.max(1,canvas.clientHeight);
    if (canvas.width !== Math.round(width*dpr) || canvas.height !== Math.round(height*dpr)) {
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    ctx.strokeStyle='#242424';ctx.beginPath();ctx.moveTo(0,height/2);ctx.lineTo(width,height/2);ctx.stroke();
    const barW=width/envelope.length;
    for (let i=0;i<envelope.length;i++) {
      const x=i*barW, amp=Math.max(2,envelope[i]*(height*.45));
      ctx.fillStyle=(i/envelope.length)*duration<=time?'#ff5c00':'#474747';
      ctx.fillRect(x,height/2-amp,Math.max(1,barW*.63),amp*2);
    }
  }
  let lastPaint = -Infinity;
  let lastWaveStep = -1;
  let lastPhase = '';
  function render(timestamp) {
    if (!started) return;
    // 30 Hz telemetry is sufficient for the cockpit; audio plays independently at full quality.
    if (timestamp - lastPaint < 32) { if (!audio.paused) animationId=requestAnimationFrame(render); return; }
    lastPaint = timestamp;
    const t=Math.min(duration,Math.max(0,audio.currentTime));
    const rpm=finished&&!revOnly?850:rpmAt(t);
    const jitter=rpm>2400?Math.sin(performance.now()*.12)*Math.min(1.4,rpm/4200):0;
    needle.style.transform=`translateX(-50%) rotate(${-140+Math.min(7000,rpm)/7000*280+jitter}deg)`;
    digital.textContent=String(rpm).padStart(4,'0');
    stage.classList.toggle('is-revving',rpm>2800);
    setStep(ignition,t>=.25);setStep(starter,t>=.65&&t<2.4);setStep(idle,t>=1.8);
    const label=t<.65?'IGNITION ON':t<1.8?'STARTER ENGAGED':t<3.85?'ENGINE IDLING':
      (t<6.75?'V8 // FIRST REV':'V8 // SECOND REV');
    if (label !== lastPhase) { phase.textContent=label;status.textContent=label;engineState.textContent=label;lastPhase=label; }
    revMode.textContent=rpm>3000?'THROTTLE OPEN':rpm?'ENGINE RUNNING':'IGNITION ON';
    const fraction=revOnly?Math.max(0,(t-revStart)/(duration-revStart)):t/duration;
    progress.style.width=(fraction*100).toFixed(1)+'%';
    pct.textContent=Math.round(fraction*100)+'%';
    clock.textContent=t.toFixed(1).padStart(4,'0')+' / 09.5';
    const waveStep=Math.floor((t / duration)*envelope.length);
    if (waveStep !== lastWaveStep) {drawWaveform(t); lastWaveStep=waveStep;}
    if (!audio.paused) animationId=requestAnimationFrame(render);
  }
  function completed() {
    cancelAnimationFrame(animationId);
    finished=true; started=true; revOnly=false;
    startBtn.hidden=true;showBtn.hidden=false;revBtn.hidden=false;revBtn.disabled=false;
    stage.classList.remove('is-revving');
    needle.style.transform='translateX(-50%) rotate(-106deg)';
    digital.textContent='0850';phase.textContent='ENGINE READY // SELECT AN ACTION';
    status.textContent='V8 READY';engineState.textContent='ENGINE RUNNING';revMode.textContent='IDLE / 850 RPM';
    progress.style.width='100%';pct.textContent='100%';drawWaveform(duration);
  }
  function play(from,onlyRevs) {
    revOnly=onlyRevs;finished=false;started=true;lastPaint=-Infinity;lastWaveStep=-1;lastPhase='';
    startBtn.hidden=true;showBtn.hidden=true;revBtn.hidden=true;
    audio.pause();audio.currentTime=from;
    const result=audio.play();
    if (result?.catch) result.catch(()=>{
      started=false; startBtn.hidden=false;showBtn.hidden=true;revBtn.hidden=true;
      phase.textContent='AUDIO BLOCKED // CLICK TO START';
    });
    cancelAnimationFrame(animationId);animationId=requestAnimationFrame(render);
  }
  startBtn?.addEventListener('click',()=>play(0,false));
  revBtn?.addEventListener('click',()=>play(revStart,true));
  let dismissed = false;
  function enterSite() {
    if (dismissed) return;
    dismissed = true;
    audio.pause(); cancelAnimationFrame(animationId); started = false;
    overlay.classList.add('slide-out-left');
    document.body.classList.remove('loading-active');
    triggerHeroTextReveal();
    setTimeout(() => overlay.remove(), 850);
  }
  showBtn?.addEventListener('click', enterSite);
  skipBtn?.addEventListener('click', enterSite);
  audio.addEventListener('ended',completed);
  audio.addEventListener('error',()=>{
    phase.textContent='AUDIO UNAVAILABLE // CHECK CADILLAC FILE';
    startBtn.hidden=false;showBtn.hidden=false;revBtn.hidden=true;
  });
  drawWaveform(0);
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
// 4. Interactive Navigation & Section Highlighting with Woosh FX
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Start preloader animation immediately
  initTelemetryPreloader();

  // Navigation Links click handler (Right Dock & CTA Buttons)
  const navButtons = document.querySelectorAll('.nav-link-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-target');
      if (!targetId) return;

      const targetElem = document.getElementById(targetId);
      if (targetElem) {
        // Play Woosh air swipe sound effect
        audioFX.playWoosh();

        // Highlight active dock item
        navButtons.forEach(b => b.classList.remove('dock-active'));
        if (btn.classList.contains('dock-item')) {
          btn.classList.add('dock-active');
        }

        // Smooth scroll to the target
        targetElem.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // If it's a table row, flash an orange highlight
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
    { x: 0.00, throttle: 88,  brake: 0,   speed: 178 },
    { x: 0.12, throttle: 100, brake: 0,   speed: 185 },
    { x: 0.22, throttle: 0,   brake: 100, speed: 166 },
    { x: 0.32, throttle: 0,   brake: 97,  speed: 127 }, // Hard threshold brake
    { x: 0.44, throttle: 0,   brake: 63,  speed: 91  },
    { x: 0.54, throttle: 0,   brake: 27,  speed: 78  }, // Trail brake
    { x: 0.62, throttle: 12,  brake: 0,   speed: 75  }, // Apex exit
    { x: 0.75, throttle: 55,  brake: 0,   speed: 91  },
    { x: 0.88, throttle: 93,  brake: 0,   speed: 132 },
    { x: 1.00, throttle: 100, brake: 0,   speed: 165 }
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

    ctx.save();
    ctx.fillStyle='rgba(242,92,5,.04)';ctx.fillRect(W*.31,0,W*.31,H);
    ctx.fillStyle='#987059';ctx.font='600 9px JetBrains Mono, monospace';
    ctx.fillText('TRAIL RELEASE',W*.38,17);
    ctx.restore();
    // Speed curve (white, max 260 km/h)
    drawSpline('speed', 'rgba(255, 255, 255, 0.4)', 260, 1.5);
    // Pure Red Brake (#FF2233)
    drawSpline('brake', '#FF2233', 100, 2.8);
    // Pure Green Throttle (#00FF66)
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


// LFM serves a separate, cross-origin document: we cannot measure its intrinsic
// height from the website. Render it at a consistent desktop width, scale the
// full license down to the available card width, and hide iframe scrollbars.
// Update BASE_HEIGHT only if LFM changes the card's intrinsic dimensions.
function initResponsiveLfmLicense() {
  for (const id of ['jk-lfm-license','cap-lfm-license']) {
    const frame=document.getElementById(id);
    if(!frame)continue;
    const viewport=frame.closest('.license-viewport');
    const update=()=>{
      const scale=Math.min(1,Math.max(180,viewport.clientWidth-32)/640);
      frame.style.transform=`translateX(-50%) scale(${scale})`;
      viewport.style.height=`${Math.ceil(260*scale)+24}px`;
    };
    update();
    if('ResizeObserver' in window)new ResizeObserver(update).observe(viewport);
    else window.addEventListener('resize',update,{passive:true});
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initResponsiveLfmLicense, { once: true });
} else {
  initResponsiveLfmLicense();
}

// V12: restrained, rAF-throttled pointer/scroll depth for the Sector4 wordmark.
(function initHeroDepth() {
  const hero = document.getElementById('hero');
  if (!hero) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let px = 0, py = 0, scroll = 0, frame = 0;
  const update = () => {
    frame = 0;
    if (reduce.matches) { hero.style.removeProperty('--hero-mx'); hero.style.removeProperty('--hero-my'); hero.style.removeProperty('--hero-scroll'); return; }
    hero.style.setProperty('--hero-mx', px.toFixed(1) + 'px');
    hero.style.setProperty('--hero-my', py.toFixed(1) + 'px');
    hero.style.setProperty('--hero-scroll', scroll.toFixed(1) + 'px');
  };
  const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
  hero.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const r = hero.getBoundingClientRect();
    px = Math.max(-16, Math.min(16, (e.clientX - r.left - r.width / 2) / r.width * 32));
    py = Math.max(-12, Math.min(12, (e.clientY - r.top - r.height / 2) / r.height * 24));
    queue();
  }, {passive:true});
  hero.addEventListener('pointerleave', () => {px=0;py=0;queue();});
  window.addEventListener('scroll', () => {const r=hero.getBoundingClientRect();scroll=Math.max(-35,Math.min(35,-r.top * .08));queue();},{passive:true});
  reduce.addEventListener?.('change',queue);
  const observer = new IntersectionObserver(entries=>entries.forEach(entry=>hero.classList.toggle('is-visible',entry.isIntersecting)),{threshold:.08});
  observer.observe(hero);
})();


// V13 // Lightweight page-wide motion design (driver identity deliberately excluded).
(function initPageMotion(){
  const chapters=[...document.querySelectorAll('.s4-chapter')];
  if(!chapters.length)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const sections=['01','02','03'];
  chapters.forEach((section,i)=>{
    section.querySelector('.section-header')?.setAttribute('data-section-index',sections[i]||'0'+(i+1));
    section.querySelectorAll('.section-header, .table-row, .activity-tile, .panel-box, .fuel-launch-card').forEach(el=>el.classList.add('s4-entrance'));
    section.addEventListener('pointermove', e=>{
      if(reduced.matches||e.pointerType==='touch')return;
      const rect=section.getBoundingClientRect();
      const mx=Math.max(-10,Math.min(10,((e.clientX-rect.left)/rect.width-.5)*20));
      section.style.setProperty('--chapter-pointer-x',mx.toFixed(1)+'px');
    },{passive:true});
    section.addEventListener('pointerleave',()=>section.style.setProperty('--chapter-pointer-x','0px'));
  });
  const animated=document.querySelectorAll('.s4-entrance');
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('s4-visible');observer.unobserve(entry.target);}
    }),{threshold:.08,rootMargin:'0px 0px 60px 0px'});
    animated.forEach(el=>observer.observe(el));
  }else{animated.forEach(el=>el.classList.add('s4-visible'));}
  let scheduled=false;
  function update(){
    scheduled=false;
    chapters.forEach(section=>{
      if(reduced.matches){section.style.removeProperty('--chapter-scroll');section.style.removeProperty('--chapter-reveal');return;}
      const r=section.getBoundingClientRect();
      if(r.bottom<0||r.top>innerHeight)return;
      const normalized=(r.top+r.height/2-innerHeight/2)/innerHeight;
      const delta=Math.max(-30,Math.min(30,-normalized*20));
      section.style.setProperty('--chapter-scroll',delta.toFixed(1)+'px');
      section.style.setProperty('--chapter-reveal',(delta*.22).toFixed(1)+'px');
    });
  }
  function queue(){if(!scheduled){scheduled=true;requestAnimationFrame(update);}}
  window.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',queue,{passive:true});
  reduced.addEventListener?.('change',queue);queue();
})();
