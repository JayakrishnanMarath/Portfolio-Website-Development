(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const form = $('fuelForm');
  if (!form) return;
  const steps = [...document.querySelectorAll('.fuel-step')];
  const indicators = [...document.querySelectorAll('.step-indicator')];
  const results = $('fuelResults');
  const error = $('fuelError');
  const rainOffsets = {light: 9, medium: 15, heavy: 24};
  let step = 1;
  let model = null;
  // Quick durations are examples, never automatic claims about current series rules.
  const preset=$('racePreset');
  function syncPreset(){
    const mins=Number(preset.value);
    if(!Number.isFinite(mins)||preset.value==='custom')return;
    $('raceHours').value=Math.floor(mins/60);
    $('raceMinutes').value=mins%60;
    $('raceSeconds').value=0;
    // A new duration invalidates a previously entered pit window: do not silently substitute one.
  }
  preset.addEventListener('change',syncPreset);
  ['raceHours','raceMinutes','raceSeconds'].forEach(id=>$(id).addEventListener('input',()=>{preset.value='custom';}));

  function number(id) {
    const el = $(id), val = Number(el.value);
    return el.value.trim() !== '' && Number.isFinite(val) && val >= Number(el.min || 0) && (el.max === '' || val <= Number(el.max)) ? val : null;
  }
  function integer(id) { const n = number(id); return n !== null && Number.isInteger(n) ? n : null; }
  function option(name) { return document.querySelector(`input[name="${name}"]:checked`)?.value; }
  const fmt = n => `${n.toFixed(1)} L`;
  const yes = name => option(name) === 'yes';
  function pitWindow(durationMins) {
    const a = $('pitWindowStart').value.trim(), b = $('pitWindowEnd').value.trim();
    if (!a && !b) return {start:0,end:durationMins,specified:false};
    if (!a || !b) return null;
    const start = number('pitWindowStart'), end = number('pitWindowEnd');
    if(start === null || end === null || start >= end || end > durationMins) return null;
    return {start,end,specified:true};
  }
  function validStep() {
    error.textContent='';
    if(step === 1) {
      const m=integer('lapMinutes'),s=integer('lapSeconds'),ms=integer('lapMillis');
      if ([m,s,ms].includes(null) || m*60+s+ms/1000 <= 0) error.textContent='Enter a valid lap time.';
    } else if(step === 2) {
      const h=integer('raceHours'),m=integer('raceMinutes'),s=integer('raceSeconds');
      if([h,m,s].includes(null) || h*3600+m*60+s <= 0) error.textContent='Enter a valid race duration.';
    } else if(step === 3 && yes('mandatory')) {
      const secs=integer('raceHours')*3600+integer('raceMinutes')*60+integer('raceSeconds');
      if(!pitWindow(secs/60)) error.textContent='Enter a valid pit window inside the race, or leave both boxes blank.';
    } else if(step === 4 && yes('wetRace') && number('rainExtraSeconds') === null) {
      error.textContent='Enter a valid wet-weather lap time adjustment.';
    } else if(step === 5 && (number('litresPerLap') === null || number('litresPerLap') <= 0)) {
      error.textContent='Enter valid litres per lap.';
    }
    return !error.textContent;
  }
  function showStep(next) {
    step = next; form.hidden=false; results.hidden=true;
    steps.forEach(s => {const active=Number(s.dataset.step) === step;s.hidden=!active;s.classList.toggle('active',active);});
    indicators.forEach((el,i)=> {el.classList.toggle('current',i===step-1);el.classList.toggle('complete',i<step-1);});
    $('stepProgress').style.width=`${step/5*100}%`;
    $('backStep').hidden=step===1;
    $('nextStep').innerHTML=step===5?'CALCULATE FUEL <span aria-hidden="true">→</span>':'NEXT STEP <span aria-hidden="true">→</span>';
    error.textContent='';
  }
  function updateConditions() {
    $('pitRulesFields').hidden=!yes('mandatory');
    $('rainFields').hidden=!yes('wetRace');
  }
  function calculate() {
    const lap=integer('lapMinutes')*60+integer('lapSeconds')+integer('lapMillis')/1000;
    const duration=integer('raceHours')*3600+integer('raceMinutes')*60+integer('raceSeconds');
    const wet=yes('wetRace');
    const penalty=wet?number('rainExtraSeconds'):0;
    const adjustedLap=lap+penalty;
    const perLap=number('litresPerLap'),buffer=integer('extraLaps');
    const laps=Math.ceil(duration/adjustedLap);
    const minimum=laps*perLap, safe=(laps+buffer)*perLap;
    const mandatory=yes('mandatory'), refuel=$('refuelAllowed').checked;
    const window=pitWindow(duration/60);
    model={lap,adjustedLap,duration,laps,minimum,safe,perLap,buffer,mandatory,refuel,window,wet,penalty};
    $('safeFuel').textContent=safe.toFixed(1);
    $('minimumFuel').textContent=fmt(minimum);
    $('raceLaps').textContent=String(laps);
    $('bufferLaps').textContent=String(buffer);
    $('fuelLaps').textContent=String(laps+buffer);
    $('resultNote').textContent=`Using ${adjustedLap.toFixed(1)}s estimated race laps${wet?` (+${penalty}s wet adjustment)`:''}: ${laps} laps × ${perLap.toFixed(2)} L, plus ${buffer} safety lap(s). Timed-race extra laps and formation fuel depend on server rules.`;
    $('stintResults').hidden=!mandatory;
    $('pitPlanner').hidden=!mandatory;
    $('plannerFields').hidden=true;
    $('openPlanner').setAttribute('aria-expanded','false');
    $('pitAdvice').hidden=true;
    if (mandatory) fillStints(duration/120); // default stop at mid-distance
    form.hidden=true;results.hidden=false;
    $('stepProgress').style.width='100%';indicators.forEach(el=>{el.classList.remove('current');el.classList.add('complete');});
    results.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'nearest'});
  }
  function fillStints(pitMinutes) {
    const {duration,adjustedLap,laps,perLap,buffer,refuel,window}=model;
    const permitted = window?.specified ? Math.min(window.end,Math.max(window.start,pitMinutes)) : pitMinutes;
    const firstLaps = Math.min(laps,Math.max(1,Math.ceil(permitted*60/adjustedLap)));
    const secondLaps = Math.max(0,laps-firstLaps);
    const start = refuel?(firstLaps+buffer)*perLap:(laps+buffer)*perLap;
    const add = refuel?secondLaps*perLap:0;
    $('stintOneFuel').textContent=fmt(start);
    $('stintTwoFuel').textContent=fmt(add);
    $('stintOneLaps').textContent=refuel?`${firstLaps} estimated laps + ${buffer} safety`:'Carry the entire race fuel at the start';
    $('stintTwoLaps').textContent=refuel?`${secondLaps} estimated laps; check available tank space`:'No fuel to add (refuelling disabled)';
    $('stintNote').textContent=`Planning stop at ~${permitted.toFixed(0)} minutes elapsed. ${refuel?'Starting fuel includes the safety margin; refuel amount is the second-stint estimate.':'The mandatory stop is not a fuel stop.'} Fuel capacity, tyre-change time, pit-lane loss and server rules are not automatically modelled.`;
  }
  function forecastAdvice(now,after10,after30,track) {
    const rain = v => v !== 'dry';
    let tyre='';
    if(track==='wet'||track==='flooded') tyre='WET tyres are the safer starting reference while the track is wet or flooded. Check the MFD track grip and actual water, not just rain icons.';
    else if(track==='damp') tyre='DAMP track: compare slick grip with wet-tyre temperature. Light rain alone does not require an immediate switch.';
    else tyre='DRY track: slick tyres are the starting reference. Watch track grip before changing to wets.';
    let transition='';
    if(!rain(now) && (rain(after10)||rain(after30))) transition='Rain is forecast to develop. Consider matching the tyre stop with the onset of sustained track wetness, if the pit window allows.';
    else if(rain(now) && !rain(after10) && !rain(after30)) transition='Rain is forecast to stop, but the surface may remain wet. Switch to slicks only once a dry line and track grip justify it.';
    else if(rain(now) && rain(after10)) transition='Rain continues in the near forecast. A wet-to-dry switch is not supported by this snapshot.';
    else if(!rain(now) && !rain(after10) && !rain(after30)) transition='No rain in the available snapshots. Remain on slicks while the circuit stays dry.';
    else transition='Mixed forecast: watch live track wetness and tyre temperatures. Forecast icons are not exact crossover times.';
    return `${tyre} ${transition}`;
  }
  function analyze() {
    if(!model)return;
    const start=integer('gridPosition');
    const output=$('pitAdvice');
    if(start===null || start<1){output.hidden=false;output.textContent='Enter a valid grid position first.';return;}
    const durationMin=model.duration/60;
    const w=model.window;
    const opening=w.specified?w.start:0;
    const closing=w.specified?w.end:durationMin;
    const usable=Math.max(0,closing-opening);
    const clamp=n=>Math.max(opening,Math.min(closing,n));
    const slots=[clamp(opening+usable*.27),clamp(opening+usable*.5),clamp(opening+usable*.73)];
    const now=$('forecastNow').value,soon=$('forecast10').value,later=$('forecast30').value;
    const condition=forecastAdvice(now,soon,later,$('trackState').value);
    const tooNarrow=usable<5;
    const scenarios=[
      {label:'LOST 5+ PLACES',subtitle:`P${start+5} OR LOWER`,mins:slots[0],reason:'An earlier stop could clear traffic. Check whether you would rejoin in clean air; otherwise stay out.'},
      {label:'AROUND START POSITION',subtitle:`NEAR P${start} · DEFAULT`,mins:slots[1],reason:'Keep a balanced stint and aim near the middle of the permitted stop window.'},
      {label:'GAINED 5+ PLACES',subtitle:`P${Math.max(1,start-5)} OR HIGHER`,mins:slots[2],reason:'Consider staying out longer if you have clean track, sufficient fuel, and healthy tyres.'}
    ];
    const safe=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;');
    output.innerHTML=`<div class="strategy-headline"><span class="result-kicker">S4 // THREE POSSIBLE CALLS</span><strong>${w.specified?`STOP WINDOW ${opening.toFixed(0)}–${closing.toFixed(0)} MIN`:'NO PIT WINDOW ENTERED'}</strong><small>Times are minutes elapsed from race start, not countdown time.</small></div><div class="pit-scenarios">${scenarios.map((s,i)=>`<article class="pit-scenario ${i===1?'recommended':''}"><div class="scenario-label">0${i+1} // ${s.label}</div><div class="scenario-time">${Math.round(s.mins)} <span>MIN ELAPSED</span></div><small>${s.subtitle}</small><p>${s.reason}</p></article>`).join('')}</div>${tooNarrow?'<p class="strategy-warning">This pit window is very narrow. The three options converge; prioritise a legal stop.</p>':''}<div class="tyre-guidance"><strong>TYRES / WEATHER</strong><p>${safe(condition)}</p><p>FORECAST: NOW ${safe($('forecastNow').selectedOptions[0].text)} · +10 ${safe($('forecast10').selectedOptions[0].text)} · +30 ${safe($('forecast30').selectedOptions[0].text)}</p><p>These are conditional planning ideas, not a verified fastest strategy. Check the server briefing and live grip before acting.</p></div>`;
    output.hidden=false;
    fillStints(slots[1]);
  }
  form.addEventListener('submit',e=>{e.preventDefault();if(!validStep())return;step<5?showStep(step+1):calculate();});
  $('backStep').addEventListener('click',()=>{if(step>1)showStep(step-1);});
  $('minusBuffer').addEventListener('click',()=>setBuffer(-1));
  $('plusBuffer').addEventListener('click',()=>setBuffer(1));
  function setBuffer(d){const n=Math.min(5,Math.max(0,integer('extraLaps')+d));$('extraLaps').value=n;$('bufferDisplay').textContent=n;}
  document.querySelectorAll('input[name="mandatory"],input[name="wetRace"]').forEach(e=>e.addEventListener('change',updateConditions));
  $('rainIntensity').addEventListener('change',()=>{$('rainExtraSeconds').value=rainOffsets[$('rainIntensity').value];});
  $('openPlanner').addEventListener('click',()=>{const open=$('plannerFields').hidden;$('plannerFields').hidden=!open;$('openPlanner').setAttribute('aria-expanded',String(open));});
  $('analyzePit').addEventListener('click',analyze);
  $('takeForecastPhoto').addEventListener('click',()=>$('forecastPhoto').click());
  let detectedForecast=null;
  let objectUrl=null;
  async function recognizeForecast(file){
    const message=$('forecastRecognition');
    message.textContent='Reading image on your device…';
    $('ocrReview').hidden=true;
    detectedForecast=null;
    try {
      // Lazy-load Tesseract.js only when a photo is captured; browser-side OCR, not a trained ACC-specific model.
      if(!window.Tesseract){
        await new Promise((resolve,reject)=>{
          const script=document.createElement('script');
          script.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
          script.onload=resolve;script.onerror=()=>reject(new Error('OCR library unavailable'));
          document.head.appendChild(script);
        });
      }
      const worker=await window.Tesseract.createWorker('eng');
      let text='';
      try{const result=await worker.recognize(file);text=result.data.text||'';}finally{await worker.terminate();}
      const compact=text.replace(/\s+/g,' ').trim();
      $('ocrText').textContent=compact||'(No readable text detected)';
      $('ocrReview').hidden=false;
      // Extract values ONLY from explicit labelled windows; do not infer icon order or map free text to the wrong time.
      const detect=(pattern)=>{
        const m=compact.match(pattern);
        if(!m)return null;
        const val=m[1].toLowerCase().replace(/\s+/g,' ');
        return val.includes('heavy')?'heavy':val.includes('medium')?'medium':val.includes('light')?'light':val.includes('dry')?'dry':null;
      };
      detectedForecast={
        forecastNow:detect(/\b(?:now|current)\b[^a-z]{0,12}(dry|light\s*rain|medium\s*rain|heavy\s*rain)/i),
        forecast10:detect(/(?:\+\s*10|10\s*min(?:utes)?)[^a-z]{0,12}(dry|light\s*rain|medium\s*rain|heavy\s*rain)/i),
        forecast30:detect(/(?:\+\s*30|30\s*min(?:utes)?)[^a-z]{0,12}(dry|light\s*rain|medium\s*rain|heavy\s*rain)/i)
      };
      const found=Object.entries(detectedForecast).filter(([,v])=>v).length;
      message.textContent=found?`Found ${found}/3 explicitly labelled conditions. Check the text and confirm.`:'Photo scanned. No reliable timestamped conditions found. Please use manual entry.';
      $('acceptOcr').disabled=found===0;
    }catch(err){
      message.textContent='Could not read the photo here (OCR requires an internet connection on first use). Enter the forecast manually below.';
      $('ocrReview').hidden=true;
    }
  }
  $('forecastPhoto').addEventListener('change',e=>{
    const file=e.target.files?.[0];
    if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}
    const img=$('forecastPreview');
    if(!file||!file.type.startsWith('image/')){img.hidden=true;return;}
    objectUrl=URL.createObjectURL(file);img.src=objectUrl;img.hidden=false;
    recognizeForecast(file);
  });
  $('acceptOcr').addEventListener('click',()=>{
    if(!detectedForecast)return;
    let n=0;
    Object.entries(detectedForecast).forEach(([id,val])=>{if(val){$(id).value=val;n++;}});
    $('forecastRecognition').textContent=`Applied ${n} detected field(s). Confirm all conditions manually before calculating.`;
  });
  $('recalculate').addEventListener('click',()=>showStep(1));
  updateConditions();showStep(1);
})();
