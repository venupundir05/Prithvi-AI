/* ==========================================================================
   Flood Evacuation Drill Visualizer (theme: deep blue / emergency red / white)
   Steps: Water rising (interactive slider) -> Secure the home (mains toggle +
   documents) -> Grab go-bag & move up (climb floors) -> Reached rooftop.
   ========================================================================== */

(function(){
  const { el, tooltip } = PRITHVI.DrillVisual;

  function building(waterPct, floorHighlight){
    const wrap = el("div");
    wrap.style.cssText = "position:relative;width:120px;height:170px;margin:0 auto;";
    wrap.innerHTML = `
      <div style="position:absolute;inset:0;border:2px solid #cbd5e1;border-radius:4px;overflow:hidden;background:#0f1620;">
        <div class="fl-floor" data-floor="2" style="position:absolute;top:0;left:0;right:0;height:33.3%;border-bottom:1px solid #334155;"></div>
        <div class="fl-floor" data-floor="1" style="position:absolute;top:33.3%;left:0;right:0;height:33.3%;border-bottom:1px solid #334155;"></div>
        <div class="fl-floor" data-floor="0" style="position:absolute;top:66.6%;left:0;right:0;height:33.4%;"></div>
        <div class="fl-water" style="position:absolute;bottom:0;left:0;right:0;height:${waterPct}%;background:linear-gradient(180deg, rgba(59,130,246,0.55), rgba(37,99,235,0.85));transition:height .25s ease;"></div>
      </div>
      <div class="fl-char" style="position:absolute;left:50%;transform:translateX(-50%);font-size:22px;transition:bottom .5s ease;bottom:${8+(floorHighlight*54)}px;">ðŸ§</div>
    `;
    return wrap;
  }

  const steps = [
    {
      label:"Water Rising",
      title:"River Level Rising â€” Drag to Simulate",
      desc:"Interactively raise the water level and watch it approach the ground floor in real time.",
      render(body, api){
        const layout = el("div");
        layout.style.cssText = "display:flex;gap:24px;align-items:center;flex-wrap:wrap;justify-content:center;";
        const b = building(12, 0);
        const controls = el("div");
        controls.style.cssText = "min-width:220px;";
        controls.innerHTML = `
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-dim);margin-bottom:4px;">
            <span>Water level</span><span id="fl-level-readout">0.4 m</span>
          </div>
          <input type="range" id="fl-slider" min="5" max="85" value="12" style="width:100%;accent-color:var(--dv-accent);">
          <button class="dv-btn" id="fl-auto" style="margin-top:12px;width:100%;">â–¶ Simulate Rising Water</button>
        `;
        layout.appendChild(b); layout.appendChild(controls);
        body.appendChild(layout);
        tooltip(controls, "Drag the slider to see how quickly rising water can approach ground-floor level once a river starts to overflow.");

        const slider = controls.querySelector("#fl-slider");
        const readout = controls.querySelector("#fl-level-readout");
        const waterDiv = b.querySelector(".fl-water");
        const setLevel = (v)=>{
          waterDiv.style.height = v+"%";
          readout.textContent = (v/28).toFixed(1)+" m";
        };
        slider.addEventListener("input", ()=> setLevel(+slider.value));

        controls.querySelector("#fl-auto").addEventListener("click", (e)=>{
          e.target.disabled = true;
          let v = +slider.value;
          const t = setInterval(()=>{
            v = Math.min(80, v+2);
            slider.value = v;
            setLevel(v);
            if(v>=80){ clearInterval(t); e.target.disabled=false; }
          }, 90);
        });
      }
    },
    {
      label:"Secure Home",
      title:"Shutting Off Mains & Raising Valuables",
      desc:"Cut electrical risk and protect essential documents before you move.",
      render(body, api){
        const row = el("div");
        row.style.cssText = "display:flex;gap:28px;align-items:center;flex-wrap:wrap;justify-content:center;";
        row.innerHTML = `
          <div style="text-align:center;">
            <button class="dv-btn" id="fl-mains" style="min-width:150px;">âš¡ Mains: <b style="color:var(--dv-accent2)">ON</b></button>
            <div style="font-size:11px;color:var(--text-dim);margin-top:6px;">Click to shut off before water rises further</div>
          </div>
          <div style="text-align:center;">
            <div class="dv-icon" id="fl-docs" style="transition:transform .4s ease;">ðŸ—‚ï¸</div>
            <button class="dv-btn" id="fl-lift" style="margin-top:8px;">Lift Documents</button>
          </div>
        `;
        body.appendChild(row);
        tooltip(row, "Switching off mains power before water reaches sockets prevents electrocution risk and electrical fires.");

        const mainsBtn = row.querySelector("#fl-mains");
        mainsBtn.addEventListener("click", ()=>{
          const on = mainsBtn.innerHTML.includes("ON");
          mainsBtn.innerHTML = on ? `âš¡ Mains: <b style="color:var(--safe)">OFF</b>` : `âš¡ Mains: <b style="color:var(--dv-accent2)">ON</b>`;
        });
        row.querySelector("#fl-lift").addEventListener("click", (e)=>{
          row.querySelector("#fl-docs").style.transform = "translateY(-14px)";
          e.target.textContent = "âœ“ Documents Secured";
          e.target.disabled = true;
        });
      }
    },
    {
      label:"Move Up",
      title:"Grabbing the Go-Bag & Climbing to Safety",
      desc:"Move floor by floor toward the rooftop, bag in hand.",
      render(body, api){
        let floor = 0;
        const layout = el("div");
        layout.style.cssText = "display:flex;gap:24px;align-items:center;flex-wrap:wrap;justify-content:center;";
        const b = building(55, floor);
        const controls = el("div");
        controls.innerHTML = `
          <div style="font-size:13px;color:var(--text-dim);margin-bottom:8px;">ðŸŽ’ Go-bag: <b style="color:var(--text)">packed</b></div>
          <div id="fl-floor-label" style="font-family:var(--font-mono);font-size:13px;margin-bottom:10px;">Floor: Ground</div>
          <button class="dv-btn primary" id="fl-climb">Climb Up â†‘</button>
        `;
        layout.appendChild(b); layout.appendChild(controls);
        body.appendChild(layout);

        const charEl = b.querySelector(".fl-char");
        const label = controls.querySelector("#fl-floor-label");
        const climbBtn = controls.querySelector("#fl-climb");
        const names = ["Ground","First Floor","Rooftop â€” Safe"];
        climbBtn.addEventListener("click", ()=>{
          floor = Math.min(2, floor+1);
          charEl.style.bottom = (8+floor*54)+"px";
          label.textContent = "Floor: "+names[floor];
          if(floor===2){ climbBtn.disabled = true; climbBtn.textContent = "Reached Rooftop âœ“"; }
        });
      }
    },
    {
      label:"Rooftop Safe",
      title:"Reached the Rooftop Assembly Point",
      desc:"Above the floodwater and visible for rescue teams â€” headcount confirmed.",
      render(body, api){
        const layout = el("div");
        layout.style.cssText = "display:flex;gap:24px;align-items:center;flex-wrap:wrap;justify-content:center;";
        layout.appendChild(building(72, 2));
        const info = el("div");
        info.innerHTML = `<div class="dv-ring" style="border-color:var(--safe);box-shadow:0 0 20px rgba(69,203,133,0.45);"><span class="dv-icon">ðŸš</span></div>
          <div style="margin-top:10px;color:var(--safe);font-weight:700;font-family:var(--font-head);">Rooftop Assembly Point</div>
          <div style="color:var(--text-dim);font-size:13px;">Visible, above water, awaiting rescue if needed.</div>`;
        layout.appendChild(info);
        body.appendChild(layout);
      }
    },
  ];

  function statusFor(i,total){
    const labels = ["Water Rising â€” Monitor","Securing Property","Evacuation In Progress","Safe â€” Drill Complete"];
    return { text: labels[i], complete: i===total-1 };
  }

  PRITHVI.drillVisualConfigs = PRITHVI.drillVisualConfigs || {};
  PRITHVI.drillVisualConfigs.flood = {
    theme:"flood",
    title:"Flood Evacuation Drill",
    subtitle:"Watch the water. Secure the home. Climb to safety â€” an interactive flood response walkthrough.",
    steps, statusFor,
    checklist:{
      do:[
        "Move to higher floors or high ground as soon as a flood warning is issued.",
        "Shut off mains electricity and gas before water reaches sockets or appliances.",
        "Carry a packed go-bag with documents, torch, phone and any medication.",
      ],
      dont:[
        "Don't walk, swim or drive through moving floodwater, even if it looks shallow.",
        "Don't wait for water to enter your home before deciding to evacuate.",
        "Don't go back down for belongings once you've reached a safe floor or rooftop.",
      ],
    },
  };

})();

