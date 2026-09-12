/* ==========================================================================
   Navigation: switching views, top-bar clock, demo-mode switch
   ========================================================================== */

(function(){

  function showView(name){
    document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
    const target = document.getElementById("view-" + name);
    if(target) target.classList.add("active");

    document.querySelectorAll(".nav-link").forEach(btn=>{
      btn.classList.toggle("active", btn.dataset.view === name);
    });

    PRITHVI.state.currentView = name;

    // If we're navigating away from an active game, pause it so it doesn't
    // keep running (and scoring) in the background.
    if(name !== "game" && PRITHVI.game && PRITHVI.game.pauseIfRunning){
      PRITHVI.game.pauseIfRunning();
    }
    const mainEl = document.getElementById("main-content");
    if(mainEl) mainEl.scrollTop = 0;
  }
  PRITHVI.showView = showView;

  document.addEventListener("DOMContentLoaded", ()=>{
    document.querySelectorAll(".nav-link[data-view]").forEach(btn=>{
      btn.addEventListener("click", ()=> showView(btn.dataset.view));
    });
    document.querySelectorAll("[data-back-to-drills]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        if(PRITHVI.game && PRITHVI.game.stop) PRITHVI.game.stop();
        showView("drills");
      });
    });

    // Clock
    function tickClock(){
      const el = document.getElementById("topbar-clock");
      if(el) el.textContent = new Date().toLocaleTimeString();
    }
    tickClock();
    setInterval(tickClock, 1000);

    // Demo mode switch
    const sw = document.getElementById("demo-switch");
    const label = document.getElementById("demo-label");
    sw.addEventListener("click", ()=>{
      PRITHVI.state.demoMode = !PRITHVI.state.demoMode;
      sw.classList.toggle("on", PRITHVI.state.demoMode);
      label.innerHTML = "Demo Mode: <strong>" + (PRITHVI.state.demoMode ? "ON" : "OFF") + "</strong>";
      PRITHVI.toast(PRITHVI.state.demoMode ? "Demo mode enabled — sensor values will now evolve live." : "Demo mode disabled — readings frozen.", "safe");
      if(PRITHVI.sensors) PRITHVI.sensors.setDemo(PRITHVI.state.demoMode);
    });
  });

})();
