/* ==========================================================================
   Drill Visualizer core — shared shell used by drill-fire.js, drill-flood.js
   and drill-pollution.js. Each hazard file supplies steps + theme + status
   text; this file renders the header, progress tracker, stage container,
   nav controls and do's/don'ts checklist, and re-renders the current
   step's stage whenever the user moves forward/back or clicks a step dot.
   ========================================================================== */

window.PRITHVI = window.PRITHVI || {};

(function(){

  function el(tag, cls, html){
    const e = document.createElement(tag);
    if(cls) e.className = cls;
    if(html !== undefined) e.innerHTML = html;
    return e;
  }

  /**
   * Attaches a small "i" tooltip button to `hostEl` that toggles a popover
   * with `text`. Safe to call multiple times per stage render.
   */
  function tooltip(hostEl, text){
    const wrap = el("span", "dv-tip");
    const btn = el("button", "dv-tip-btn", "i");
    btn.type = "button";
    const pop = el("div", "dv-tip-pop hidden", text);
    btn.addEventListener("click", (e)=>{
      e.stopPropagation();
      document.querySelectorAll(".dv-tip-pop").forEach(p=>{ if(p!==pop) p.classList.add("hidden"); });
      pop.classList.toggle("hidden");
    });
    document.addEventListener("click", ()=> pop.classList.add("hidden"));
    wrap.appendChild(btn); wrap.appendChild(pop);
    hostEl.appendChild(wrap);
    return wrap;
  }

  function mount(container, cfg){
    container.innerHTML = "";
    const root = el("div", "dv-root theme-" + cfg.theme);

    // header
    const header = el("div", "dv-header");
    const titleWrap = el("div");
    titleWrap.appendChild(el("h2", null, cfg.title));
    titleWrap.appendChild(el("div", "dv-sub", cfg.subtitle));
    const badge = el("div", "dv-status-badge");
    badge.innerHTML = `<span class="dot"></span><span class="dv-status-text"></span>`;
    header.appendChild(titleWrap);

    const rightWrap = el("div");
    rightWrap.style.cssText = "display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;";
    rightWrap.appendChild(badge);
    if(cfg.onClose){
      const closeBtn = el("button", "dv-btn", "✕ Close");
      closeBtn.addEventListener("click", cfg.onClose);
      rightWrap.appendChild(closeBtn);
    }
    header.appendChild(rightWrap);
    root.appendChild(header);

    // progress tracker
    const progress = el("div", "dv-progress");
    cfg.steps.forEach((s,i)=>{
      if(i>0) progress.appendChild(el("div","dv-step-line"));
      const b = el("button", "dv-step-btn");
      b.innerHTML = `<div class="dv-step-circle">${i+1}</div><div class="dv-step-label">${s.label}</div>`;
      b.addEventListener("click", ()=> goTo(i));
      progress.appendChild(b);
    });
    root.appendChild(progress);

    // stage
    const stage = el("div", "dv-stage");
    root.appendChild(stage);

    // nav controls
    const controls = el("div", "dv-controls");
    const prevBtn = el("button", "dv-btn", "← Previous");
    const count = el("span", "dv-count");
    const nextBtn = el("button", "dv-btn primary", "Next →");
    controls.appendChild(prevBtn); controls.appendChild(count); controls.appendChild(nextBtn);
    root.appendChild(controls);

    // checklist
    if(cfg.checklist){
      const grid = el("div", "dv-checklist");
      const doCol = el("div", "dv-check-col do");
      doCol.appendChild(el("h4", null, "✓ Do"));
      cfg.checklist.do.forEach(t=> doCol.appendChild(el("div","dv-check-card",t)));
      const dontCol = el("div", "dv-check-col dont");
      dontCol.appendChild(el("h4", null, "✕ Don't"));
      cfg.checklist.dont.forEach(t=> dontCol.appendChild(el("div","dv-check-card",t)));
      grid.appendChild(doCol); grid.appendChild(dontCol);
      root.appendChild(grid);
    }

    container.appendChild(root);

    let idx = 0;

    function renderStep(){
      const total = cfg.steps.length;
      const step = cfg.steps[idx];

      progress.querySelectorAll(".dv-step-btn").forEach((b,i)=>{
        b.classList.toggle("active", i===idx);
        b.classList.toggle("done", i<idx);
      });
      progress.querySelectorAll(".dv-step-line").forEach((l,i)=>{
        l.classList.toggle("done", i < idx);
      });

      const statusInfo = cfg.statusFor ? cfg.statusFor(idx, total) : { text: step.label, complete:false };
      badge.classList.toggle("complete", !!statusInfo.complete);
      badge.querySelector(".dv-status-text").textContent = statusInfo.text;

      const inner = el("div", "dv-stage-inner");
      inner.appendChild(el("div", "dv-stage-title", step.title));
      if(step.desc) inner.appendChild(el("div", "dv-stage-desc", step.desc));
      const body = el("div");
      inner.appendChild(body);
      stage.innerHTML = "";
      stage.appendChild(inner);
      step.render(body, { tooltip, goTo, idx, total });

      count.textContent = `Step ${idx+1} of ${total}`;
      prevBtn.disabled = idx === 0;
      nextBtn.textContent = idx === total-1 ? "Restart Drill ↺" : "Next →";
    }

    function goTo(i){
      idx = Math.max(0, Math.min(cfg.steps.length-1, i));
      renderStep();
    }

    prevBtn.addEventListener("click", ()=> goTo(idx-1));
    nextBtn.addEventListener("click", ()=>{
      if(idx === cfg.steps.length-1) goTo(0);
      else goTo(idx+1);
    });

    renderStep();
    return { goTo };
  }

  PRITHVI.DrillVisual = { mount, tooltip, el };

})();

