/* ==========================================================================
   PRITHVI AI — Global State
   Single shared store. Every module reads/writes through PRITHVI.state and
   calls PRITHVI.saveProgress() to persist drill/quiz history to localStorage.
   ========================================================================== */

window.PRITHVI = window.PRITHVI || {};

(function(){

  const STORAGE_KEY = "prithvi_ai_progress_v1";

  function loadProgress(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw) return JSON.parse(raw);
    }catch(e){ /* ignore corrupt storage */ }
    return { history: [] };
  }

  PRITHVI.state = {
    demoMode: false,
    currentView: "dashboard",
    progress: loadProgress(),     // { history: [ {type, hazard, result, score, time} ] }
    activeGame: null,             // hazard key of game currently loaded
    activeQuizHazard: null,
    activeAcademyHazard: null,
  };

  PRITHVI.saveProgress = function(){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(PRITHVI.state.progress));
    }catch(e){ /* storage unavailable — fail silently, session still works */ }
  };

  PRITHVI.recordActivity = function(entry){
    // entry: { type: 'drill'|'quiz', hazard, result, score, meta, ts }
    entry.ts = Date.now();
    PRITHVI.state.progress.history.push(entry);
    // Keep the log bounded
    if(PRITHVI.state.progress.history.length > 200){
      PRITHVI.state.progress.history.shift();
    }
    PRITHVI.saveProgress();
    if(PRITHVI.onActivityRecorded) PRITHVI.onActivityRecorded(entry);
  };

  PRITHVI.resetProgress = function(){
    PRITHVI.state.progress = { history: [] };
    PRITHVI.saveProgress();
  };

  // Small toast utility used across modules
  PRITHVI.toast = function(message, kind){
    const stack = document.getElementById("toast-stack");
    if(!stack) return;
    const el = document.createElement("div");
    el.className = "toast" + (kind ? " " + kind : "");
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(()=>{ el.style.transition = "opacity .3s"; el.style.opacity = "0"; setTimeout(()=>el.remove(), 300); }, 3200);
  };

  PRITHVI.clamp = (v,min,max)=> Math.max(min, Math.min(max, v));
  PRITHVI.rand = (min,max)=> min + Math.random()*(max-min);
  PRITHVI.fmtTime = (sec)=>{
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec/60), s = sec%60;
    return m + ":" + String(s).padStart(2,"0");
  };

})();
