/* ==========================================================================
   PRITHVI AI — Preparedness Score (Performance Analytics)
   Reads PRITHVI.state.progress.history (drill + quiz results) and rolls it
   up into an overall score, per-hazard scores, a skill breakdown, badges
   and simple training recommendations.
   ========================================================================== */

(function(){

  const HAZARDS = ["flood","fire","pollution"];

  const BADGES = [
    { id:"first-drill", icon:"🎯", name:"First Responder", check:(h)=> h.some(e=>e.type==="drill") },
    { id:"flood-ready",  icon:"🌊", name:"Flood Ready",     check:(h)=> h.some(e=>e.type==="drill"&&e.hazard==="flood"&&e.result==="win") },
    { id:"fire-ready",   icon:"🔥", name:"Fire Ready",      check:(h)=> h.some(e=>e.type==="drill"&&e.hazard==="fire"&&e.result==="win") },
    { id:"air-ready",    icon:"🌬️", name:"Clean Air Ready", check:(h)=> h.some(e=>e.type==="drill"&&e.hazard==="pollution"&&e.result==="win") },
    { id:"triple-threat",icon:"🏅", name:"Triple Threat",   check:(h)=> ["flood","fire","pollution"].every(hz=> h.some(e=>e.type==="drill"&&e.hazard===hz&&e.result==="win")) },
    { id:"quiz-whiz",    icon:"🧠", name:"Quiz Whiz",       check:(h)=> h.some(e=>e.type==="quiz"&&e.score===100) },
    { id:"perfect-prep", icon:"⭐", name:"Perfect Prep",    check:(h)=> computeOverall(h) >= 80 },
  ];

  function avg(arr){ return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }

  function hazardScore(history, hazard){
    const drills = history.filter(e=>e.type==="drill"&&e.hazard===hazard);
    const quizzes = history.filter(e=>e.type==="quiz"&&e.hazard===hazard);
    const drillScores = drills.map(e=> PRITHVI.clamp(e.score/6, 0, 100)); // finalScore roughly 0-600 -> 0-100
    const quizScores = quizzes.map(e=> e.score);
    const parts = drillScores.concat(quizScores);
    return Math.round(avg(parts));
  }

  function computeOverall(history){
    const scores = HAZARDS.map(h=>hazardScore(history,h)).filter(s=>s>0 || true);
    const anyData = history.length>0;
    return anyData ? Math.round(avg(HAZARDS.map(h=>hazardScore(history,h)))) : 0;
  }

  function computeSkills(history){
    const drills = history.filter(e=>e.type==="drill");
    const quizzes = history.filter(e=>e.type==="quiz");

    const response = drills.length ? Math.round(avg(drills.map(e=> PRITHVI.clamp(100 - (e.meta.time/100)*70, 5, 100)))) : 0;
    const decision = drills.length ? Math.round((drills.filter(e=>e.result==="win").length/drills.length)*100) : 0;
    const route = drills.length ? Math.round(avg(drills.map(e=> (e.meta.items/Math.max(1,e.meta.totalItems))*100))) : 0;
    const hazardAwareness = drills.length ? Math.round(avg(drills.map(e=> PRITHVI.clamp(e.meta.health,0,100)))) : 0;
    const knowledge = quizzes.length ? Math.round(avg(quizzes.map(e=>e.score))) : 0;

    return { response, decision, route, hazardAwareness, knowledge };
  }

  function drawRing(canvas, pct){
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio||1;
    const size = 120;
    canvas.width = size*dpr; canvas.height = size*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,size,size);
    const cx=size/2, cy=size/2, r=48;
    ctx.strokeStyle = "#1a2332"; ctx.lineWidth=10;
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
    ctx.strokeStyle = "#2fd9c4"; ctx.lineWidth=10; ctx.lineCap="round";
    ctx.beginPath(); ctx.arc(cx,cy,r,-Math.PI/2, -Math.PI/2 + (pct/100)*Math.PI*2); ctx.stroke();
  }

  function renderBadges(history){
    const grid = document.getElementById("badge-grid");
    grid.innerHTML = BADGES.map(b=>{
      const unlocked = b.check(history);
      return `<div class="badge ${unlocked?"":"locked"}"><div class="b-icon">${b.icon}</div><div class="b-name">${b.name}</div></div>`;
    }).join("");
  }

  function renderHistoryTable(history){
    const tbody = document.querySelector("#history-table tbody");
    if(!history.length){
      tbody.innerHTML = `<tr><td colspan="5" style="color:var(--text-dim)">No activity yet.</td></tr>`;
      return;
    }
    const rows = history.slice().reverse().slice(0,15).map(e=>{
      const when = new Date(e.ts).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
      const activity = e.type === "drill" ? "Disaster Drill" : "Quiz";
      const resultLabel = e.type==="drill" ? (e.result==="win"?"Reached safety":"Did not finish") : (e.result==="pass"?"Passed":"Needs review");
      const scoreLabel = e.type==="drill" ? e.score : e.score+"%";
      return `<tr><td>${activity}</td><td><span class="tag ${e.hazard}">${PRITHVI.HAZARD_LABEL[e.hazard].toUpperCase()}</span></td><td>${resultLabel}</td><td style="font-family:var(--font-mono)">${scoreLabel}</td><td style="color:var(--text-faint)">${when}</td></tr>`;
    });
    tbody.innerHTML = rows.join("");
  }

  function renderRecommendations(history, skills){
    const wrap = document.getElementById("perf-recommendations");
    if(!history.length){
      wrap.innerHTML = `<li>Complete drills and quizzes to generate personalised recommendations.</li>`;
      return;
    }
    const recs = [];
    const weakestHazard = HAZARDS.slice().sort((a,b)=>hazardScore(history,a)-hazardScore(history,b))[0];
    recs.push(`Your lowest preparedness score is for ${PRITHVI.HAZARD_LABEL[weakestHazard]} — try its drill and quiz again to raise it.`);
    const skillEntries = Object.entries(skills);
    const weakestSkill = skillEntries.sort((a,b)=>a[1]-b[1])[0];
    const skillNames = { response:"response time", decision:"decision making", route:"route selection", hazardAwareness:"hazard awareness", knowledge:"safety knowledge" };
    if(weakestSkill && weakestSkill[1] < 70){
      recs.push(`Focus on ${skillNames[weakestSkill[0]]} — it's currently your weakest tracked skill.`);
    }
    const drills = history.filter(e=>e.type==="drill");
    if(drills.some(e=>e.result==="lose")){
      recs.push("On failed drills, try leaving for the safe zone earlier rather than exploring for every item.");
    }
    wrap.innerHTML = recs.map(r=>`<li>${r}</li>`).join("");
  }

  function render(){
    const history = PRITHVI.state.progress.history;
    const overall = computeOverall(history);
    document.getElementById("prep-overall").textContent = overall + "%";
    drawRing(document.getElementById("prep-ring"), overall);

    HAZARDS.forEach(h=>{
      document.getElementById("prep-"+h).textContent = hazardScore(history,h) + "%";
    });

    const skills = computeSkills(history);
    const map = { response:"skill-response", decision:"skill-decision", route:"skill-route", hazardAwareness:"skill-hazard", knowledge:"skill-knowledge" };
    Object.keys(map).forEach(k=>{
      document.getElementById(map[k]).style.width = skills[k]+"%";
      document.getElementById(map[k]+"-val").textContent = skills[k]+"%";
    });

    renderBadges(history);
    renderHistoryTable(history);
    renderRecommendations(history, skills);
  }

  PRITHVI.onActivityRecorded = render;

  document.addEventListener("DOMContentLoaded", ()=>{
    render();
    document.querySelectorAll('.nav-link[data-view="performance"]').forEach(btn=>{
      btn.addEventListener("click", render);
    });
    document.getElementById("perf-reset").addEventListener("click", ()=>{
      if(confirm("Reset all drill and quiz progress? This cannot be undone.")){
        PRITHVI.resetProgress();
        render();
        PRITHVI.toast("Progress reset.");
      }
    });
  });

})();
