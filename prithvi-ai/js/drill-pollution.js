/* ==========================================================================
   Air Pollution (Smog/AQI) Drill Visualizer (theme: slate / cyan / yellow)
   Steps: Seal & purify -> Respirator check -> Shift activities indoors ->
   Monitor particulate reduction.
   ========================================================================== */

(function(){
  const { el, tooltip } = PRITHVI.DrillVisual;

  function gauge(value, max, color){
    const pct = Math.max(0, Math.min(1, value/max));
    const wrap = el("div");
    wrap.className = "ap-gauge";
    wrap.style.cssText = `width:96px;height:96px;border-radius:50%;display:flex;align-items:center;justify-content:center;
      background:conic-gradient(${color} ${pct*360}deg, var(--bg-panel-2) 0deg);`;
    const inner = el("div");
    inner.style.cssText = "width:74px;height:74px;border-radius:50%;background:var(--bg-panel);display:flex;flex-direction:column;align-items:center;justify-content:center;";
    inner.innerHTML = `<span class="ap-gauge-val" style="font-family:var(--font-mono);font-weight:700;font-size:18px;">${Math.round(value)}</span><span style="font-size:9px;color:var(--text-dim);">AQI</span>`;
    wrap.appendChild(inner);
    return wrap;
  }

  const steps = [
    {
      label:"Seal & Purify",
      title:"Activating Purifiers & Sealing Windows",
      desc:"Indoor air is being sealed off from outdoor smog and filtered continuously.",
      render(body, api){
        const row = el("div");
        row.style.cssText = "display:flex;align-items:center;gap:24px;flex-wrap:wrap;";
        const g = gauge(96, 400, "var(--dv-accent2)");
        const icons = el("div");
        icons.style.cssText = "display:flex;gap:18px;align-items:center;";
        icons.innerHTML = `<span class="dv-icon" title="Sealed window">🪟🔒</span><span class="dv-icon dv-spin">🌀</span>`;
        row.appendChild(g); row.appendChild(icons);
        body.appendChild(row);
        tooltip(row, "Sealing gaps and running a purifier continuously keeps indoor PM2.5 well below outdoor levels during a smog event.");
        let v=96; const t=setInterval(()=>{ if(!g.isConnected){ clearInterval(t); return; } v=Math.min(180,v+4); g.style.background=`conic-gradient(var(--dv-accent2) ${(v/400)*360}deg, var(--bg-panel-2) 0deg)`; g.querySelector(".ap-gauge-val").textContent=Math.round(v); if(v>=180) clearInterval(t); },80);
      }
    },
    {
      label:"Respirator",
      title:"Wearing a Proper N95 Respirator Outdoors",
      desc:"Outdoor AQI has moved into the hazardous band — a well-fitted mask is essential before stepping out.",
      render(body, api){
        const row = el("div");
        row.style.cssText = "display:flex;align-items:center;gap:24px;flex-wrap:wrap;";
        row.appendChild(gauge(240,400,"var(--dv-bad)"));
        const info = el("div");
        info.innerHTML = `<span class="dv-icon">😷</span>
          <div style="color:var(--dv-bad);font-weight:700;margin-top:6px;">Outdoor AQI: Hazardous</div>
          <div style="color:var(--text-dim);font-size:13px;">N95 or better fit-checked before going outside.</div>`;
        row.appendChild(info);
        body.appendChild(row);
        tooltip(row, "A loosely worn cloth mask does little against PM2.5 — a properly fitted N95/FFP2 filters fine particulates far more effectively.");
      }
    },
    {
      label:"Shift Indoors",
      title:"Shifting Outdoor Activities Indoors",
      desc:"Exercise, play and errands are moved indoors until the AQI improves.",
      render(body, api){
        const stage = el("div");
        stage.style.cssText = "display:flex;align-items:center;justify-content:center;gap:22px;";
        stage.innerHTML = `
          <div style="text-align:center;opacity:0.4;"><span class="dv-icon">🏃‍♂️</span><div style="font-size:11px;color:var(--text-dim);">Outdoor run</div></div>
          <span class="dv-icon dv-bounce-x" style="font-size:22px;">➡️</span>
          <div style="text-align:center;"><span class="dv-icon">🧘‍♀️</span><div style="font-size:11px;color:var(--dv-accent);">Indoor session</div></div>
        `;
        body.appendChild(stage);
      }
    },
    {
      label:"Monitor",
      title:"Monitoring Real-Time Particulate Reduction",
      desc:"Indoor purification is tracked live until levels return to a safe band.",
      render(body, api){
        const row = el("div");
        row.style.cssText = "display:flex;align-items:center;gap:24px;";
        const g = gauge(240,400,"var(--safe)");
        const info = el("div");
        info.innerHTML = `<div style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">Indoor AQI trending down…</div>`;
        row.appendChild(g); row.appendChild(info);
        body.appendChild(row);
        let v=240;
        const t=setInterval(()=>{
          if(!g.isConnected){ clearInterval(t); return; }
          v=Math.max(58,v-6);
          g.style.background=`conic-gradient(var(--safe) ${(v/400)*360}deg, var(--bg-panel-2) 0deg)`;
          g.querySelector(".ap-gauge-val").textContent=Math.round(v);
          if(v<=58){ clearInterval(t); info.innerHTML = `<div style="color:var(--safe);font-weight:700;">Air quality improved — safe to resume normal indoor activity.</div>`; }
        },70);
      }
    },
  ];

  function statusFor(i,total){
    const labels = ["Sealing & Purifying","Respirator Required","Activities Shifted Indoors","Air Quality Improved"];
    return { text: labels[i], complete: i===total-1 };
  }

  PRITHVI.drillVisualConfigs = PRITHVI.drillVisualConfigs || {};
  PRITHVI.drillVisualConfigs.pollution = {
    theme:"pollution",
    title:"Severe Air Pollution (Smog/AQI) Drill",
    subtitle:"Seal. Protect. Shift indoors. Monitor — responding to a hazardous AQI event.",
    steps, statusFor,
    checklist:{
      do:[
        "Seal gaps and run an air purifier indoors once AQI enters the 'unhealthy' band.",
        "Wear a well-fitted N95/FFP2 mask if you must go outdoors.",
        "Move exercise and outdoor plans indoors until AQI improves.",
      ],
      dont:[
        "Don't exercise or exert yourself outdoors at hazardous AQI levels.",
        "Don't rely on a loose scarf or cloth mask for fine particulate protection.",
        "Don't assume indoor air is automatically safe without sealing and filtration.",
      ],
    },
  };

})();

