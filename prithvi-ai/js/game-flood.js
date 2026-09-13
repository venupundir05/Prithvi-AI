/* ==========================================================================
   Scenario: FLOOD — "Rising Waters"
   River at the bottom of the map floods upward over time. Player starts
   near the riverside and must reach high ground before the water — and
   their own health — runs out. Two broad routes: the short riverside path
   (floods first) or the longer inland streets (safer, slower).
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
    rectWall(w,0,0,COLS-1,0);           // top border
    rectWall(w,0,ROWS-1,COLS-1,ROWS-1); // bottom border (riverbank)
    rectWall(w,0,0,0,ROWS-1);           // left border
    rectWall(w,COLS-1,0,COLS-1,ROWS-1); // right border

    // Building blocks that force route choices
    rectWall(w,6,4,10,7);
    rectWall(w,13,8,18,11);
    rectWall(w,20,3,25,6);
    rectWall(w,21,10,27,13);
    rectWall(w,3,11,7,13);
    return w;
  }

  function buildConfig(){
    const walls = buildWalls();
    return {
      cols:COLS, rows:ROWS,
      walls,
      start:{ x: 2*T+8, y: 14*T+8 },
      safeZone:{ x:(COLS-4)*T, y:1*T, w:3*T, h:3*T },
      groundColor:"#152030",
      wallColor:"#2c3a52",
      hazardColor:[79,142,247],
      playerColor:"#2fd9c4",
      drainRate:16,
      timeLimit:100,
      loseMessages:{
        health:"The floodwater overwhelmed you before you reached high ground.",
        time:"The river breached its banks completely — the drill timed out.",
      },
      items:[
        { id:"boots", x:4*T+20, y:15*T+20, icon:"🥾", score:70,
          onCollect(engine){ engine.flags.hasBoots = true; PRITHVI.toast("Rubber boots equipped — reduced water exposure.", "safe"); } },
        { id:"kit", x:16*T+20, y:6*T+20, icon:"🧰", score:80,
          onCollect(engine){ engine.health = PRITHVI.clamp(engine.health+22,0,100); PRITHVI.toast("Emergency kit used — health restored.", "safe"); } },
        { id:"phone", x:24*T+20, y:9*T+20, icon:"📱", score:60,
          onCollect(engine){ PRITHVI.toast("You alerted emergency services of your location.", "safe"); } },
      ],

      onStart(engine){
        engine.floodLevel = -4;
      },

      onUpdate(engine, dt){
        engine.floodLevel += dt * 0.24; // rises to fully cover the 18-row map in ~90s
        for(let r=0;r<ROWS;r++){
          const distFromRiver = (ROWS-1) - r;
          for(let c=0;c<COLS;c++){
            const ripple = Math.sin(engine.elapsed*1.4 + c*0.6 + r*0.3)*0.12;
            const raw = (engine.floodLevel - distFromRiver)/1.6 + ripple;
            engine.hazard[r][c] = PRITHVI.clamp(raw, 0, 1);
          }
        }
      },

      modifyDrain(engine, drain, intensity){
        return engine.flags.hasBoots ? drain*0.5 : drain;
      },

      onDrawScreen(engine, ctx){
        const w = engine.canvas.width, h = engine.canvas.height;
        ctx.save();
        ctx.strokeStyle = "rgba(180,210,255,0.35)";
        ctx.lineWidth = 1;
        for(let i=0;i<26;i++){
          const x = (i*57 + engine.elapsed*260) % (w+40) - 20;
          const y = (i*41 + engine.elapsed*380) % (h+40) - 20;
          ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-6,y+16); ctx.stroke();
        }
        ctx.restore();
      },

      onHud(engine){ PRITHVI.drillUI.updateHud(engine, "Water"); },
      onEnd(engine, result){ PRITHVI.drillUI.handleEnd(engine, result, "flood"); },
      onPauseToggle(engine, paused){ PRITHVI.drillUI.handlePause(paused); },
      onItem(engine, item){ PRITHVI.drillUI.refreshInventory(engine); },
    };
  }

  PRITHVI.scenarios = PRITHVI.scenarios || {};
  PRITHVI.scenarios.flood = {
    title:"Rising Waters",
    subtitle:"Objective: reach high ground before the river floods your route. Avoid deep water — it drains health fast.",
    buildConfig,
    tips:[
      "Never walk or drive through moving floodwater — 15 cm can knock an adult off their feet.",
      "Move to higher floors or high ground immediately once a flood warning is issued; don't wait for water to arrive.",
      "Avoid pooled water near electrical lines or transformers — it may be energised.",
      "Keep a grab-bag ready with a torch, phone, ID copies and any emergency kit before the season starts.",
    ],
  };

})();
