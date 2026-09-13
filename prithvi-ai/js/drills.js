/* ==========================================================================
   Drill hub controller — bridges the generic DrillEngine to the DOM:
   HUD readouts, start/pause/win/lose overlays, inventory icons, and the
   post-drill feedback panel. Also records results into PRITHVI.state.
   ========================================================================== */

(function(){

  let engine = null;
  let currentHazard = null;

  const els = {};
  function cacheEls(){
    ["game-title","game-subtitle","hud-time","hud-health","hud-health-label","hud-score","hud-zone",
     "hud-inventory","game-canvas","game-overlay","overlay-title","overlay-text","overlay-primary-btn",
     "postgame-panel","postgame-heading","pg-time","pg-health","pg-items","pg-score","pg-tips"
    ].forEach(id=> els[id] = document.getElementById(id));
  }

  function setOverlay(visible, {title, text, btnLabel, onBtn, kind} = {}){
    els["game-overlay"].classList.toggle("hidden", !visible);
    els["game-overlay"].className = "game-overlay" + (kind ? " "+kind : "") + (visible ? "" : " hidden");
    if(!visible) return;
    els["overlay-title"].textContent = title || "";
    els["overlay-text"].textContent = text || "";
    const btn = els["overlay-primary-btn"];
    btn.textContent = btnLabel || "Start";
    btn.onclick = onBtn || (()=>{});
  }

  function buildInventory(){
    const wrap = els["hud-inventory"];
    wrap.innerHTML = "";
    engine.items.forEach(it=>{
      const d = document.createElement("div");
      d.className = "hud-item";
      d.dataset.id = it.id;
      d.textContent = it.icon;
      d.title = it.id;
      wrap.appendChild(d);
    });
  }

  function refreshInventory(eng){
    els["hud-inventory"].querySelectorAll(".hud-item").forEach(d=>{
      const it = eng.items.find(i=>i.id===d.dataset.id);
      d.classList.toggle("have", !!(it && it.collected));
    });
    els["hud-score"].textContent = eng.score;
  }

  function updateHud(eng){
    els["hud-time"].textContent = PRITHVI.fmtTime(eng.elapsed);
    const health = Math.round(eng.health);
    els["hud-health"].textContent = health + "%";
    els["hud-health"].closest(".hud-chip").classList.toggle("low", health < 30);
    els["hud-score"].textContent = eng.score;
    const t = eng.tileAt(eng.player.x+eng.player.w/2, eng.player.y+eng.player.h/2);
    els["hud-zone"].textContent = (t.hazard > 0.5) ? "DANGER ZONE" : (t.hazard > 0.15 ? "HAZARD NEARBY" : "CLEAR");
  }

  function handlePause(paused){
    if(paused){
      setOverlay(true, {
        title:"Paused", text:"Take a breath. Resume when ready.",
        btnLabel:"Resume", onBtn:()=>{ engine.togglePause(); setOverlay(false); }
      });
    }
  }

  function skillTipsFor(hazard, result, itemsCollected, totalItems){
    const tips = (PRITHVI.scenarios[hazard].tips || []).slice(0,2);
    const extra = [];
    if(result === "lose") extra.push("Try leaving earlier next time — the biggest score gains come from acting before conditions escalate, not from outrunning them.");
    if(itemsCollected < totalItems) extra.push(`You collected ${itemsCollected}/${totalItems} protective items — grabbing gear early reduces exposure for the rest of the route.`);
    if(result === "win") extra.push("Good work reaching safety — compare your response time next attempt to see if an earlier decision saves more time.");
    return extra.concat(tips);
  }

  function handleEnd(eng, result, hazard){
    const itemsCollected = eng.items.filter(i=>i.collected).length;
    setOverlay(true, {
      title: result === "win" ? "Drill Complete — You Reached Safety" : "Drill Failed",
      text: eng.endMessage,
      btnLabel:"View Results",
      kind: result === "win" ? "win" : "lose",
      onBtn:()=>{
        setOverlay(false);
        els["postgame-panel"].classList.remove("hidden");
        els["postgame-panel"].scrollIntoView({behavior:"smooth", block:"start"});
      }
    });

    els["postgame-heading"].textContent = result === "win" ? "Drill Complete" : "Drill Failed — Try Again";
    els["pg-time"].textContent = PRITHVI.fmtTime(eng.elapsed);
    els["pg-health"].textContent = Math.round(eng.health) + "%";
    els["pg-items"].textContent = itemsCollected + " / " + eng.items.length;
    els["pg-score"].textContent = eng.finalScore;

    const tipList = skillTipsFor(hazard, result, itemsCollected, eng.items.length);
    els["pg-tips"].innerHTML = tipList.map(t=>`<li>${t}</li>`).join("");

    PRITHVI.recordActivity({
      type:"drill", hazard, result, score:eng.finalScore,
      meta:{ time:eng.elapsed, health:eng.health, items:itemsCollected, totalItems:eng.items.length }
    });
    PRITHVI.toast(result === "win" ? "Drill complete — results saved to Performance." : "Drill failed — results saved to Performance.", result==="win"?"safe":"danger");
  }

  PRITHVI.drillUI = { updateHud, handleEnd, handlePause, refreshInventory };

  function openGame(hazard){
    currentHazard = hazard;
    cacheEls();
    els["postgame-panel"].classList.add("hidden");
    const scenario = PRITHVI.scenarios[hazard];
    els["game-title"].textContent = scenario.title;
    els["game-subtitle"].textContent = scenario.subtitle;

    if(engine) engine.destroy();
    const cfg = scenario.buildConfig();
    engine = new PRITHVI.DrillEngine(els["game-canvas"], cfg);
    buildInventory();
    updateHud(engine);

    PRITHVI.game = {
      pauseIfRunning: ()=> engine && engine.pauseIfRunning(),
      stop: ()=> engine && engine.stop(),
    };

    setOverlay(true, {
      title: scenario.title,
      text: scenario.subtitle + " Use WASD or arrow keys to move, E to pick up items, P to pause.",
      btnLabel:"Start Drill",
      onBtn:()=>{ setOverlay(false); engine.start(); }
    });

    PRITHVI.showView("game");
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    document.querySelectorAll("[data-open-game]").forEach(btn=>{
      btn.addEventListener("click", ()=> openGame(btn.dataset.openGame));
    });
    document.getElementById("pg-retry").addEventListener("click", ()=>{
      document.getElementById("postgame-panel").classList.add("hidden");
      setOverlay(true, {
        title: PRITHVI.scenarios[currentHazard].title,
        text:"Ready for another attempt?",
        btnLabel:"Start Drill",
        onBtn:()=>{ setOverlay(false); engine.start(); }
      });
    });
  
  });

})();
