/* ==========================================================================
   Live Monitoring view — dual-series line charts drawn on plain canvas
   ========================================================================== */

(function(){

  function drawDualChart(canvas, seriesA, seriesB, colorA, colorB){
    if(!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 300, h = canvas.clientHeight || 190;
    canvas.width = w*dpr; canvas.height = h*dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);

    // gridlines
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for(let i=1;i<4;i++){
      const y = (h/4)*i;
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
    }

    function plot(series, color){
      if(series.length < 2) return;
      const min = Math.min(...series), max = Math.max(...series);
      const range = (max-min) || 1;
      ctx.beginPath();
      series.forEach((v,i)=>{
        const x = (i/(series.length-1)) * w;
        const y = h - ((v-min)/range) * (h-16) - 8;
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    plot(seriesA, colorA);
    plot(seriesB, colorB);
  }

  const CHART_DEFS = [
    { id:"chart-flood",     hazard:"flood",     a:"waterLevel", b:"rainfall",  ca:"#4f8ef7", cb:"#2fd9c4" },
    { id:"chart-fire",      hazard:"fire",      a:"temperature", b:"smoke",    ca:"#ff7a45", cb:"#f2a93b" },
    { id:"chart-pollution", hazard:"pollution", a:"aqi",        b:"pm25",      ca:"#b78ce0", cb:"#f0555c" },
  ];

  const NODE_ID = {
    "flood.waterLevel":"FL-01", "flood.rainfall":"FL-02", "flood.riseRate":"FL-03", "flood.flowRate":"FL-04",
    "fire.temperature":"FR-01", "fire.humidity":"FR-02", "fire.smoke":"FR-03", "fire.wind":"FR-04",
    "pollution.aqi":"PL-01", "pollution.pm25":"PL-02", "pollution.pm10":"PL-03", "pollution.visibility":"PL-04",
  };
  const CHANNEL_LABEL = {
    waterLevel:"Flood / Water level", rainfall:"Flood / Rainfall", riseRate:"Flood / Rise rate", flowRate:"Flood / Flow rate",
    temperature:"Fire / Temperature", humidity:"Fire / Humidity", smoke:"Fire / Smoke density", wind:"Fire / Wind speed",
    aqi:"Pollution / AQI", pm25:"Pollution / PM2.5", pm10:"Pollution / PM10", visibility:"Pollution / Visibility",
  };

  function renderRawFeed(s){
    const tbody = document.querySelector("#raw-feed-table tbody");
    const rows = [];
    PRITHVI.sensors.HAZARDS.forEach(hazard=>{
      Object.keys(s.values[hazard]).forEach(key=>{
        const val = s.values[hazard][key];
        const level = s.risk[hazard];
        rows.push(`<tr>
          <td>${CHANNEL_LABEL[key]}</td>
          <td style="font-family:var(--font-mono);color:var(--text-dim)">${NODE_ID[hazard+"."+key]}</td>
          <td style="font-family:var(--font-mono)">${val.toFixed(2)}</td>
          <td><span class="hc-level ${level}" style="font-size:10px;padding:2px 7px;">${level.toUpperCase()}</span></td>
          <td style="color:var(--text-faint)">just now</td>
        </tr>`);
      });
    });
    tbody.innerHTML = rows.join("");
  }

  function render(s){
    if(PRITHVI.state.currentView !== "monitoring") return; // save cycles when not visible
    CHART_DEFS.forEach(def=>{
      const canvas = document.getElementById(def.id);
      const hist = s.history[def.hazard];
      drawDualChart(canvas, hist.map(p=>p[def.a]), hist.map(p=>p[def.b]), def.ca, def.cb);
    });
    renderRawFeed(s);
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    PRITHVI.sensors.subscribe(render);
    // also redraw whenever the user opens this tab (canvas sizes are 0 while hidden)
    document.querySelectorAll('.nav-link[data-view="monitoring"]').forEach(btn=>{
      btn.addEventListener("click", ()=> setTimeout(()=>render(PRITHVI.sensors.getState()), 30));
    });
  });

})();
