/* ==========================================================================
   Scenario: POLLUTION — "Beat the AQI"
   Two factory stacks and a busy arterial road pump out drifting smog
   clouds. Backstreets are cleaner but longer; the main road is fast but
   toxic. A slow city-wide haze also thickens over time. Reach the
   filtered-air shelter with as little exposure as possible.
   ========================================================================== */

(function(){

  const COLS = 32, ROWS = 18;
  const T = PRITHVI.TILE;

  function rectWall(walls, c0,r0,c1,r1){
    for(let r=r0;r<=r1;r++) for(let c=c0;c<=c1;c++){
      if(r>=0&&c>=0&&r<walls.length&&c<walls[0].length) walls[r][c]=1;
    }
  }

  function buildWalls(){
    const w = PRITHVI.makeGrid(COLS,ROWS,0);
    rectWall(w,0,0,COLS-1,0);
    rectWall(w,0,ROWS-1,COLS-1,ROWS-1);
    rectWall(w,0,0,0,ROWS-1);
    rectWall(w,COLS-1,0,COLS-1,ROWS-1);

    // city blocks
    rectWall(w,5,3,8,6);
    rectWall(w,5,10,8,14);
    rectWall(w,12,3,15,6);
    rectWall(w,19,8,22,12);
    rectWall(w,24,3,27,6);
    rectWall(w,12,12,16,14);
    return w;
  }

  function buildConfig(){
    const walls = buildWalls();
    const sources = [
      { baseC:9, baseR:9, radius:6.5, strength:1.0, phase:0,   speed:0.35, amp:2.2 },
      { baseC:22, baseR:5, radius:5.5, strength:0.9, phase:2.1, speed:0.4,  amp:2.0 },
    ];
    return {
      cols:COLS, rows:ROWS,
      walls,
      start:{ x:2*T+8, y:2*T+8 },
      safeZone:{ x:(COLS-4)*T, y:(ROWS-4)*T, w:3*T, h:3*T },
      groundColor:"#1a1a20",
      wallColor:"#3a3550",
      hazardColor:[183,140,224],
      playerColor:"#2fd9c4",
      drainRate:14,
      timeLimit:110,
      loseMessages:{
        health:"Prolonged exposure pushed your AQI health impact too high.",
        time:"City-wide smog thickened to hazardous levels — the drill timed out.",
      },
      items:[
        { id:"mask", x:6*T+20, y:16*T+20, icon:"😷", score:70,
          onCollect(engine){ engine.flags.hasMask = true; PRITHVI.toast("Anti-pollution mask equipped — reduced exposure.", "safe"); } },
        { id:"inhaler", x:26*T+20, y:9*T+20, icon:"💊", score:80,
          onCollect(engine){ engine.health = PRITHVI.clamp(engine.health+22,0,100); PRITHVI.toast("Inhaler used — health restored.", "safe"); } },
        { id:"purifier", x:15*T+20, y:16*T+20, icon:"🌬️", score:60,
          onCollect(engine){ PRITHVI.toast("Portable purifier collected — bonus preparedness points.", "safe"); } },
      ],
      roadRows:[8,9],

      onStart(engine){ engine.sources = sources; },

      onUpdate(engine, dt){
        const t = engine.elapsed;
        const haze = PRITHVI.clamp(t/engine.cfg.timeLimit * 0.35, 0, 0.35); // city-wide thickening
        for(let r=0;r<ROWS;r++){
          for(let c=0;c<COLS;c++){
            if(engine.walls[r][c]){ engine.hazard[r][c]=0; continue; }
            let v = haze;
            // arterial road baseline emissions
            if(engine.cfg.roadRows.includes(r)) v += 0.28;
            engine.sources.forEach(s=>{
              const cx = s.baseC + Math.sin(t*s.speed + s.phase)*s.amp;
              const cy = s.baseR + Math.cos(t*s.speed*0.8 + s.phase)*s.amp*0.6;
              const d = Math.hypot(c-cx, r-cy);
              if(d < s.radius) v += s.strength * (1 - d/s.radius);
            });
            engine.hazard[r][c] = PRITHVI.clamp(v, 0, 1);
          }
        }
      },

      modifyDrain(engine, drain, intensity){
        return engine.flags.hasMask ? drain*0.5 : drain;
      },

      onDrawScreen(engine, ctx){
        const w = engine.canvas.width;
        const v = engine.tileAt(engine.player.x, engine.player.y).hazard;
        const localAqi = Math.round(50 + v*350);
        ctx.save();
        ctx.fillStyle = "rgba(20,10,25,0.55)";
        ctx.fillRect(w-150,10,140,34);
        ctx.strokeStyle="#b78ce0"; ctx.strokeRect(w-150,10,140,34);
        ctx.fillStyle="#b78ce0"; ctx.font="bold 12px sans-serif"; ctx.textAlign="left"; ctx.textBaseline="middle";
        ctx.fillText("LOCAL AQI ~" + localAqi, w-142, 27);
        ctx.restore();
      },

      onHud(engine){ PRITHVI.drillUI.updateHud(engine, "Exposure"); },
      onEnd(engine, result){ PRITHVI.drillUI.handleEnd(engine, result, "pollution"); },
      onPauseToggle(engine, paused){ PRITHVI.drillUI.handlePause(paused); },
      onItem(engine, item){ PRITHVI.drillUI.refreshInventory(engine); },
    };
  }

  PRITHVI.scenarios = PRITHVI.scenarios || {};
  PRITHVI.scenarios.pollution = {
    title:"Beat the AQI",
    subtitle:"Objective: cross the city to filtered-air shelter while minimising smog exposure from traffic and factory drift.",
    buildConfig,
    tips:[
      "Check the local AQI before outdoor activity — avoid strenuous exercise outdoors above AQI 150.",
      "Backstreets away from traffic corridors generally have lower exposure than main roads.",
      "A well-fitted mask meaningfully cuts particulate exposure during short outdoor exposure.",
      "Keep windows closed and use an air purifier indoors on high-AQI days.",
    ],
  };

})();
