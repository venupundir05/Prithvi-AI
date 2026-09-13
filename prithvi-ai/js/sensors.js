/* ==========================================================================
   PRITHVI AI — Simulated Sensor Engine
   Produces realistic mock readings for Flood / Forest Fire / Pollution.
   In Demo Mode it runs a scripted "event" on a rotating hazard so the whole
   pipeline (metrics -> risk score -> alert -> UI) visibly moves through
   Normal -> Warning -> High Risk -> Critical and back down.
   This module owns no DOM — dashboard.js / monitoring.js / warnings.js
   subscribe to it and render.
   ========================================================================== */

(function(){

  const HAZARDS = ["flood","fire","pollution"];
  const HISTORY_LEN = 60;

  const baseline = {
    flood:      { waterLevel:1.2, rainfall:4,  riseRate:0.02, flowRate:18 },
    fire:       { temperature:29, humidity:48, smoke:6,       wind:9 },
    pollution:  { aqi:62,         pm25:28,     pm10:55,       visibility:6.4 },
  };

  const state = {
    values: JSON.parse(JSON.stringify(baseline)),
    history: { flood:[], fire:[], pollution:[] },
    risk: { flood:"normal", fire:"normal", pollution:"normal", overall:"normal" },
    riskScore: { flood:5, fire:5, pollution:8 },
    trend: { flood:"flat", fire:"flat", pollution:"flat" },
    event: null,          // { hazard, phase:'rising'|'recovering', elapsed, duration }
    listeners: [],
    loopHandle: null,
    demo: false,
  };

  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

  /* ---- risk scoring per hazard, returns {score(0-100), level} ---- */
  function scoreFlood(v){
    let s = clamp((v.waterLevel - 1) / (6 - 1) * 100, 0, 100);
    s += clamp(v.riseRate * 40, 0, 25);
    return clamp(s, 0, 100);
  }
  function scoreFire(v){
    let s = clamp((v.temperature - 25) / (55 - 25) * 60, 0, 60);
    s += clamp(v.smoke / 100 * 30, 0, 30);
    s += clamp((v.wind - 5) / 40 * 15, 0, 15);
    s -= clamp((v.humidity - 40) / 60 * 10, 0, 10);
    return clamp(s, 0, 100);
  }
  function scorePollution(v){
    return clamp(v.aqi / 400 * 100, 0, 100);
  }
  const scorers = { flood:scoreFlood, fire:scoreFire, pollution:scorePollution };

  function levelFromScore(s){
    if(s < 25) return "normal";
    if(s < 50) return "warning";
    if(s < 75) return "high";
    return "critical";
  }

  /* ---- random-walk one hazard's raw values toward (optional) a target bias ---- */
  function driftHazard(hazard, bias){
    const v = state.values[hazard];
    bias = bias || 0; // -1 recover, 0 idle noise, +1 escalate

    if(hazard === "flood"){
      v.riseRate = clamp(v.riseRate + (bias*0.06) + PRITHVI.rand(-0.01,0.01), -0.05, 0.9);
      v.waterLevel = clamp(v.waterLevel + v.riseRate*0.35 + PRITHVI.rand(-0.02,0.02), 0.3, 8);
      v.rainfall = clamp(v.rainfall + bias*4 + PRITHVI.rand(-1,1), 0, 90);
      v.flowRate = clamp(v.flowRate + bias*6 + PRITHVI.rand(-2,2), 5, 220);
    } else if(hazard === "fire"){
      v.temperature = clamp(v.temperature + bias*1.4 + PRITHVI.rand(-0.4,0.4), 18, 60);
      v.humidity = clamp(v.humidity - bias*2 + PRITHVI.rand(-1,1), 8, 90);
      v.smoke = clamp(v.smoke + bias*5 + PRITHVI.rand(-1,1), 0, 100);
      v.wind = clamp(v.wind + bias*1.2 + PRITHVI.rand(-1,1), 0, 55);
    } else if(hazard === "pollution"){
      v.aqi = clamp(v.aqi + bias*12 + PRITHVI.rand(-3,3), 15, 420);
      v.pm25 = clamp(v.aqi*0.45 + PRITHVI.rand(-3,3), 5, 260);
      v.pm10 = clamp(v.aqi*0.75 + PRITHVI.rand(-4,4), 10, 400);
      v.visibility = clamp(10 - (v.aqi/45) + PRITHVI.rand(-0.2,0.2), 0.3, 10);
    }
  }

  function pushHistory(hazard){
    const arr = state.history[hazard];
    arr.push(Object.assign({t: Date.now()}, state.values[hazard], {score: state.riskScore[hazard]}));
    if(arr.length > HISTORY_LEN) arr.shift();
  }

  function updateRisk(hazard){
    const prevScore = state.riskScore[hazard];
    const s = scorers[hazard](state.values[hazard]);
    state.riskScore[hazard] = s;
    state.risk[hazard] = levelFromScore(s);
    const delta = s - prevScore;
    state.trend[hazard] = delta > 1.2 ? "up" : (delta < -1.2 ? "down" : "flat");
  }

  function updateOverall(){
    const order = {normal:0, warning:1, high:2, critical:3};
    let worst = "normal";
    HAZARDS.forEach(h=>{ if(order[state.risk[h]] > order[worst]) worst = state.risk[h]; });
    state.risk.overall = worst;
  }

  /* ---- demo-mode scripted event: pick a hazard, ramp up, then recover ---- */
  function maybeStartEvent(){
    if(state.event) return;
    if(Math.random() < 0.35){
      const hazard = HAZARDS[Math.floor(Math.random()*HAZARDS.length)];
      state.event = { hazard, phase:"rising", elapsed:0, duration: PRITHVI.rand(14,22) };
    }
  }

  function stepEvent(dtSec){
    if(!state.event) return;
    const ev = state.event;
    ev.elapsed += dtSec;
    const bias = ev.phase === "rising" ? 1 : -1;
    driftHazard(ev.hazard, bias);
    if(ev.phase === "rising" && ev.elapsed >= ev.duration){
      ev.phase = "recovering"; ev.elapsed = 0; ev.duration = PRITHVI.rand(16,24);
    } else if(ev.phase === "recovering" && ev.elapsed >= ev.duration){
      state.event = null;
    }
  }

  /* ---- one full sample tick across all hazards ---- */
  function sampleOnce(dtSec){
    dtSec = dtSec || 1;
    HAZARDS.forEach(h=>{
      const isEventHazard = state.event && state.event.hazard === h;
      if(!isEventHazard) driftHazard(h, 0);
    });
    stepEvent(dtSec);
    HAZARDS.forEach(h=>{ updateRisk(h); pushHistory(h); });
    updateOverall();
    notify();
  }

  function notify(){
    state.listeners.forEach(fn=>{ try{ fn(state); }catch(e){ console.error(e); } });
  }

  function startLoop(){
    if(state.loopHandle) return;
    state.loopHandle = setInterval(()=>{
      maybeStartEvent();
      sampleOnce(1.2);
    }, 1200);
  }
  function stopLoop(){
    if(state.loopHandle){ clearInterval(state.loopHandle); state.loopHandle = null; }
  }

  // seed some history so charts aren't empty on first paint
  for(let i=0;i<HISTORY_LEN;i++){
    HAZARDS.forEach(h=>{ updateRisk(h); pushHistory(h); });
  }
  updateOverall();

  PRITHVI.sensors = {
    HAZARDS,
    getState: ()=> state,
    subscribe(fn){ state.listeners.push(fn); },
    setDemo(on){
      state.demo = on;
      if(on) startLoop(); else stopLoop();
    },
    refreshOnce(){ sampleOnce(1); }, // manual "Refresh readings" — small variation, no event
    levelFromScore,
  };

})();
