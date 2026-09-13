/* ==========================================================================
   Forest Fire Drill Visualizer (theme: amber / orange / red)
   Steps: Spotting smoke -> Clearing firebreaks -> Evacuate against wind ->
   Reach safe assembly point.
   ========================================================================== */

(function(){
  const { el, tooltip } = PRITHVI.DrillVisual;

  const steps = [
    {
      label:"Spot Smoke",
      title:"Smoke Sensor Triggered",
      desc:"An automated sensor has flagged rising smoke density near the treeline.",
      render(body, api){
        const row = el("div");
        row.style.cssText = "display:flex;align-items:center;gap:24px;flex-wrap:wrap;";
        const ringWrap = el("div","dv-ring dv-pulse");
        ringWrap.innerHTML = `<span class="dv-icon">🔥</span>`;
        const info = el("div");
        info.innerHTML = `<div style="font-family:var(--font-mono);font-size:13px;color:var(--dv-accent);font-weight:700;">SENSOR FR-07 — ALERT</div>
          <div style="color:var(--text-dim);font-size:13px;margin-top:4px;">Smoke density: <b style="color:var(--text)">62%</b> · Wind: <b style="color:var(--text)">Easterly, 14 km/h</b></div>`;
        row.appendChild(ringWrap); row.appendChild(info);
        body.appendChild(row);
        tooltip(row, "Smoke sensors detect particulate spikes long before flames are visible, giving you the earliest possible warning.");
      }
    },
    {
      label:"Firebreaks",
      title:"Clearing Dry Brush & Creating Firebreaks",
      desc:"Cleared strips of land are being cut to stop the fire's path from reaching structures.",
      render(body, api){
        const label = el("div");
        label.style.cssText = "display:flex;justify-content:space-between;font-size:12px;color:var(--text-dim);margin-bottom:6px;";
        label.innerHTML = `<span>🪓 Brush cleared</span><span class="ff-fb-pct">0%</span>`;
        const track = el("div");
        track.style.cssText = "height:14px;border-radius:8px;background:var(--bg-panel-2);overflow:hidden;border:1px solid var(--border);";
        const fill = el("div");
        fill.style.cssText = "height:100%;width:0%;background:linear-gradient(90deg,#8a5a30,var(--dv-accent2));transition:width 1.8s ease;";
        track.appendChild(fill);
        body.appendChild(label); body.appendChild(track);
        tooltip(label, "A firebreak is a cleared gap in vegetation that removes fuel, slowing or stopping a fire's spread.");

        const pctEl = label.querySelector(".ff-fb-pct");
        requestAnimationFrame(()=>{
          setTimeout(()=>{
            fill.style.width = "78%";
            let pct = 0;
            const t = setInterval(()=>{
              if(!pctEl.isConnected){ clearInterval(t); return; }
              pct = Math.min(78, pct+3);
              pctEl.textContent = pct+"%";
              if(pct>=78) clearInterval(t);
            }, 60);
          }, 100);
        });
      }
    },
    {
      label:"Evacuate",
      title:"Evacuating Crosswind / Against Wind Direction",
      desc:"Moving away from the fire's downwind path — never straight ahead of a wind-driven fire.",
      render(body, api){
        const stage = el("div");
        stage.style.cssText = "position:relative;height:90px;";
        stage.innerHTML = `
          <span class="dv-icon dv-bounce-x" style="position:absolute;left:10px;top:24px;">🏃</span>
          <span class="dv-icon" style="position:absolute;right:10px;top:20px;">🔥</span>
          <div style="position:absolute;left:50%;top:10px;transform:translateX(-50%);font-family:var(--font-mono);font-size:11px;color:var(--dv-accent2);">WIND → EAST</div>
          <div style="position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--border);"></div>
        `;
        body.appendChild(stage);
        tooltip(stage, "Wind-driven fire spreads fastest downwind. Moving crosswind (perpendicular to the wind) gets you clear of its path fastest.");
      }
    },
    {
      label:"Assembly Point",
      title:"Reached the Safe Assembly Point",
      desc:"Clear of the treeline and smoke path. Headcount and status check complete.",
      render(body, api){
        const row = el("div");
        row.style.cssText = "display:flex;align-items:center;gap:20px;";
        row.innerHTML = `<div class="dv-ring" style="border-color:var(--safe);box-shadow:0 0 20px rgba(69,203,133,0.45);"><span class="dv-icon">✅</span></div>
          <div><div style="color:var(--safe);font-weight:700;font-family:var(--font-head);">Assembly Point Reached</div>
          <div style="color:var(--text-dim);font-size:13px;margin-top:3px;">Open ground, upwind of the fire — headcount confirmed.</div></div>`;
        body.appendChild(row);
      }
    },
  ];

  function statusFor(i,total){
    if(i===0) return { text:"Monitoring — Alert Detected", complete:false };
    if(i===total-1) return { text:"Safe — Drill Complete", complete:true };
    return { text:"Evacuation In Progress", complete:false };
  }

  PRITHVI.drillVisualConfigs = PRITHVI.drillVisualConfigs || {};
  PRITHVI.drillVisualConfigs.fire = {
    theme:"fire",
    title:"Forest Fire Response Drill",
    subtitle:"Sense. Clear. Evacuate. Regroup — a step-by-step wildfire response walkthrough.",
    steps, statusFor,
    checklist:{
      do:[
        "Evacuate the moment smoke or an official alert reaches you — don't wait for visible flames.",
        "Move crosswind or upwind, never straight ahead of the fire's downwind path.",
        "Cover your nose and mouth with a mask or damp cloth while moving through smoke.",
      ],
      dont:[
        "Don't head downwind of the fire or through dense unburned vegetation to save time.",
        "Don't wait to see how big the fire gets before leaving.",
        "Don't return to check on property until officials confirm it's safe.",
      ],
    },
  };

})();

