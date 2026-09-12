/* ==========================================================================
   Training Videos / Disaster Safety Academy
   No external video assets — each module is a small procedurally-animated
   canvas scene with timed captions, plus a structured What/Why/Do/Don't/
   When/Where breakdown rendered as a static list underneath.
   ========================================================================== */

(function(){

  const MODULES = {
    flood:{
      title:"Flood Safety",
      accent:"#4f8ef7",
      captions:[
        { t:"What's happening", d:"Heavy rainfall and river rise are causing water to spread into low-lying streets and homes." },
        { t:"Why it's dangerous", d:"Fast-moving water just 15–30 cm deep can sweep away an adult, and floodwater often hides electrical and sewage hazards." },
        { t:"What to do", d:"Move to higher floors or high ground immediately, and carry your emergency kit if you have time to grab it." },
        { t:"Where to go", d:"Head to your area's designated high-ground shelter — never wait on a rooftop hoping water recedes on its own." },
      ],
      steps:[
        {tag:"What", cls:"", text:"River and drain levels rise faster than they can drain, flooding streets and ground floors."},
        {tag:"Why", cls:"", text:"Moving water is far more dangerous than it looks — it can carry debris and conceal drops, open drains and live wires."},
        {tag:"Do", cls:"do", text:"Move upward and inland early; unplug electrical appliances if water is approaching."},
        {tag:"Do", cls:"do", text:"Keep a battery radio or charged phone to receive official updates."},
        {tag:"Don't", cls:"dont", text:"Don't walk, swim or drive through floodwater, even if it looks shallow or calm."},
        {tag:"Don't", cls:"dont", text:"Don't wait for water to reach you before deciding to evacuate."},
        {tag:"When to evacuate", cls:"", text:"As soon as a flood warning is issued for your area — not after water starts entering your home."},
        {tag:"Where to go", cls:"", text:"The nearest designated high-ground shelter or upper floors of a solid building, away from riverbanks."},
      ],
      draw(ctx,w,h,t){
        ctx.fillStyle="#0d1420"; ctx.fillRect(0,0,w,h);
        const level = h*0.75 - Math.sin(t*0.5)*6 - Math.min(t*4, h*0.35);
        ctx.fillStyle="rgba(79,142,247,0.85)";
        ctx.fillRect(0, Math.max(h*0.25,level), w, h);
        // buildings silhouette
        ctx.fillStyle="#1a2332";
        for(let i=0;i<6;i++){ ctx.fillRect(20+i*100, h*0.35, 60, h*0.5); }
        // rain
        ctx.strokeStyle="rgba(200,220,255,0.5)";
        for(let i=0;i<40;i++){
          const x = (i*53 + t*220) % (w+40)-20, y=(i*37+t*300)%(h+40)-20;
          ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-4,y+12); ctx.stroke();
        }
      }
    },
    fire:{
      title:"Forest Fire Safety",
      accent:"#ff7a45",
      captions:[
        { t:"What's happening", d:"Dry vegetation and wind are letting a wildfire spread quickly along the treeline toward nearby settlements." },
        { t:"Why it's dangerous", d:"Fire can outrun a person on foot when wind-driven, and smoke inhalation is often more dangerous than the flames themselves." },
        { t:"What to do", d:"Evacuate crosswind or upwind of the fire, cover your nose and mouth, and avoid dense dry vegetation corridors." },
        { t:"Where to go", d:"Move to open ground or a designated assembly point well clear of the treeline and downwind smoke path." },
      ],
      steps:[
        {tag:"What", cls:"", text:"A wildfire is spreading through dry vegetation, pushed by wind toward inhabited areas."},
        {tag:"Why", cls:"", text:"Wind-driven fire can move faster than walking pace, and smoke reduces visibility and breathable air well ahead of the flames."},
        {tag:"Do", cls:"do", text:"Evacuate early, moving crosswind or away from the fire's wind direction."},
        {tag:"Do", cls:"do", text:"Cover nose and mouth with a mask or damp cloth; keep skin covered."},
        {tag:"Don't", cls:"dont", text:"Don't head downwind of the fire or through dense unburned vegetation to save time."},
        {tag:"Don't", cls:"dont", text:"Don't wait to see how big the fire gets before leaving."},
        {tag:"When to evacuate", cls:"", text:"The moment you see or smell smoke nearby, or receive any official alert — don't wait for direct visual of flames."},
        {tag:"Where to go", cls:"", text:"Open ground, a cleared assembly point, or a designated shelter away from the treeline."},
      ],
      draw(ctx,w,h,t){
        ctx.fillStyle="#160e08"; ctx.fillRect(0,0,w,h);
        ctx.fillStyle="#241a10";
        for(let i=0;i<8;i++){ ctx.beginPath(); ctx.moveTo(i*90,h); ctx.lineTo(i*90+30,h-70); ctx.lineTo(i*90+60,h); ctx.fill(); }
        for(let i=0;i<24;i++){
          const x = 40+i*24 + Math.sin(t*2+i)*6;
          const flick = Math.abs(Math.sin(t*6+i*1.3));
          const hgt = 40+flick*35;
          const grad = ctx.createLinearGradient(0,h-hgt,0,h);
          grad.addColorStop(0,"rgba(255,220,120,0.9)"); grad.addColorStop(1,"rgba(255,90,40,0.9)");
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.moveTo(x-10,h); ctx.lineTo(x,h-hgt); ctx.lineTo(x+10,h); ctx.fill();
        }
        ctx.fillStyle="rgba(80,80,80,0.25)";
        for(let i=0;i<10;i++){ const x=(i*77+t*40)%w, y = h*0.3 - (t*10+i*20)%(h*0.3); ctx.beginPath(); ctx.arc(x,y,10,0,Math.PI*2); ctx.fill(); }
      }
    },
    pollution:{
      title:"Pollution Safety",
      accent:"#b78ce0",
      captions:[
        { t:"What's happening", d:"Vehicle and industrial emissions are pushing the city's Air Quality Index into unhealthy territory." },
        { t:"Why it's dangerous", d:"Fine particulate matter (PM2.5) penetrates deep into the lungs and bloodstream, especially harmful for children and those with respiratory conditions." },
        { t:"What to do", d:"Limit outdoor exertion, wear a well-fitted mask outdoors, and keep windows closed with an air purifier running indoors." },
        { t:"Where to go", d:"Stay in, or move to, an indoor space with filtered air until the AQI drops back to a safer band." },
      ],
      steps:[
        {tag:"What", cls:"", text:"Traffic and factory emissions accumulate faster than they disperse, spiking the AQI across the city."},
        {tag:"Why", cls:"", text:"PM2.5 and PM10 particulates bypass the body's natural filters and can affect the heart and lungs with prolonged exposure."},
        {tag:"Do", cls:"do", text:"Check AQI before going outdoors; wear a mask rated for particulates if you must go out."},
        {tag:"Do", cls:"do", text:"Keep windows shut and run an air purifier or wet-mop dusty surfaces indoors."},
        {tag:"Don't", cls:"dont", text:"Don't exercise or exert yourself outdoors when AQI is in the 'unhealthy' band or worse."},
        {tag:"Don't", cls:"dont", text:"Don't rely on a cloth scarf alone for fine particulate protection."},
        {tag:"When to evacuate", cls:"", text:"When indoor air also becomes compromised (e.g. from nearby fire smoke) — move to a cleaner-air zone or shelter."},
        {tag:"Where to go", cls:"", text:"An indoor location with filtered or purified air, away from traffic corridors and industrial zones."},
      ],
      draw(ctx,w,h,t){
        ctx.fillStyle="#15121a"; ctx.fillRect(0,0,w,h);
        ctx.fillStyle="#241f30";
        for(let i=0;i<7;i++){ ctx.fillRect(i*95, h-100-((i%3)*30), 70, 100+((i%3)*30)); }
        // smog haze layers
        for(let layer=0;layer<3;layer++){
          ctx.fillStyle = `rgba(183,140,224,${0.10+layer*0.05})`;
          ctx.beginPath();
          for(let x=0;x<=w;x+=20){
            const y = h*0.55 + layer*20 + Math.sin(t*0.6+x*0.02+layer)*10;
            x===0? ctx.moveTo(x,y): ctx.lineTo(x,y);
          }
          ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle="rgba(255,180,120,0.5)";
        for(let i=0;i<3;i++){ ctx.fillRect(60+i*180, h-140, 14, 40); }
      }
    },
  };

  let current = null, playing = false, stepIdx = 0, stepStart = 0, raf = null;
  const STEP_DURATION = 4.2;

  function renderStepList(hazard){
    const list = document.getElementById("academy-step-list");
    list.innerHTML = MODULES[hazard].steps.map(s=>`<div class="step-item ${s.cls}"><span class="si-tag">${s.tag}</span><span>${s.text}</span></div>`).join("");
  }

  function updateCaptionUI(){
    const mod = MODULES[current];
    document.getElementById("academy-step-count").textContent = (stepIdx+1) + " / " + mod.captions.length;
    document.getElementById("academy-progress-fill").style.width = ((stepIdx)/(mod.captions.length))*100 + "%";
  }

  function loop(ts){
    if(!playing) return;
    const canvas = document.getElementById("academy-canvas");
    const ctx = canvas.getContext("2d");
    const t = ts/1000;
    const mod = MODULES[current];
    mod.draw(ctx, canvas.width, canvas.height, t);

    // caption overlay
    const cap = mod.captions[stepIdx];
    ctx.save();
    ctx.fillStyle = "rgba(5,8,14,0.72)";
    ctx.fillRect(0, canvas.height-84, canvas.width, 84);
    ctx.fillStyle = mod.accent; ctx.font="bold 15px sans-serif"; ctx.textAlign="left";
    ctx.fillText(cap.t, 18, canvas.height-56);
    ctx.fillStyle = "#e7ecf5"; ctx.font="13px sans-serif";
    wrapText(ctx, cap.d, 18, canvas.height-34, canvas.width-36, 18);
    ctx.restore();

    if(stepStart===0) stepStart = t;
    if(t - stepStart > STEP_DURATION){
      stepStart = t;
      stepIdx = (stepIdx+1) % mod.captions.length;
      updateCaptionUI();
    }
    raf = requestAnimationFrame(loop);
  }

  function wrapText(ctx,text,x,y,maxWidth,lineHeight){
    const words = text.split(" ");
    let line = "";
    let ly = y;
    for(let i=0;i<words.length;i++){
      const test = line + words[i] + " ";
      if(ctx.measureText(test).width > maxWidth && i>0){
        ctx.fillText(line, x, ly); line = words[i]+" "; ly += lineHeight;
      } else line = test;
    }
    ctx.fillText(line, x, ly);
  }

  function openModule(hazard){
    current = hazard; stepIdx = 0; stepStart = 0; playing = false;
    document.getElementById("academy-player-title").textContent = MODULES[hazard].title;
    document.getElementById("academy-player").classList.remove("hidden");
    document.getElementById("academy-play").textContent = "▶ Play";
    renderStepList(hazard);
    updateCaptionUI();
    // draw a static first frame
    const canvas = document.getElementById("academy-canvas");
    MODULES[hazard].draw(canvas.getContext("2d"), canvas.width, canvas.height, 0);
    document.getElementById("academy-player").scrollIntoView({behavior:"smooth", block:"start"});
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    document.querySelectorAll("[data-open-academy]").forEach(btn=>{
      btn.addEventListener("click", ()=> openModule(btn.dataset.openAcademy));
    });
    document.getElementById("academy-close").addEventListener("click", ()=>{
      playing = false; if(raf) cancelAnimationFrame(raf);
      document.getElementById("academy-player").classList.add("hidden");
    });
    document.getElementById("academy-play").addEventListener("click", (e)=>{
      playing = !playing;
      e.target.textContent = playing ? "⏸ Pause" : "▶ Play";
      if(playing) raf = requestAnimationFrame(loop);
      else if(raf) cancelAnimationFrame(raf);
    });
  });

})();
