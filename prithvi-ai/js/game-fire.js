/* ==========================================================================
   Scenario: FOREST FIRE — "Escape the Fire"
   A wildfire starts along the western treeline and spreads cell-to-cell,
   pushed harder in whatever direction the wind is currently blowing. Wind
   direction rotates every ~16s. Player must clear the forest before the
   fire (or the smoke) catches them.
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

    // dense-tree clusters forcing route decisions
    rectWall(w,8,3,11,6);
    rectWall(w,14,9,17,12);
    rectWall(w,19,4,22,7);
    rectWall(w,10,12,13,15);
    rectWall(w,23,11,27,13);
    return w;
  }

  const WIND_DIRS = [ {x:1,y:0,label:"EAST"}, {x:0,y:1,label:"SOUTH"}, {x:-0.3,y:-1,label:"NORTH"}, {x:0.7,y:0.7,label:"SOUTH-EAST"} ];

  function buildConfig(){
    const walls = buildWalls();
    return {
      cols:COLS, rows:ROWS,
      walls,
      start:{ x:(COLS-3)*T, y:(ROWS-3)*T },
      safeZone:{ x:1*T, y:1*T, w:3*T, h:3*T },
      groundColor:"#1c1a14",
      wallColor:"#2f4a2a",
      hazardColor:[255,90,40],
      playerColor:"#2fd9c4",
      drainRate:20,
      timeLimit:110,
      loseMessages:{
        health:"The heat and smoke overcame you before you cleared the treeline.",
        time:"The fire front swept through the whole area — the drill timed out.",
      },
      items:[
        { id:"mask", x:20*T+20, y:14*T+20, icon:"😷", score:70,
          onCollect(engine){ engine.flags.hasMask = true; PRITHVI.toast("N95 mask equipped — reduced smoke exposure.", "safe"); } },
        { id:"kit", x:6*T+20, y:14*T+20, icon:"🧰", score:80,
          onCollect(engine){ engine.health = PRITHVI.clamp(engine.health+22,0,100); PRITHVI.toast("First-aid kit used — health restored.", "safe"); } },
        { id:"map", x:15*T+20, y:2*T+20, icon:"🗺️", score:60,
          onCollect(engine){ PRITHVI.toast("Terrain map found — evacuation route confirmed.", "safe"); } },
      ],

      onStart(engine){
        // ignite the western treeline
        for(let r=0;r<ROWS;r++){
          for(let c=0;c<3;c++){ if(!engine.walls[r][c]) engine.hazard[r][c] = 1; }
        }
        engine.wind = WIND_DIRS[0];
        engine.windTimer = 0;
        engine._fireBuf = PRITHVI.makeGrid(COLS,ROWS,0);
      },

      onUpdate(engine, dt){
        engine.windTimer += dt;
        if(engine.windTimer > 16){
          engine.windTimer = 0;
          let next = WIND_DIRS[Math.floor(Math.random()*WIND_DIRS.length)];
          engine.wind = next;
          PRITHVI.toast("Wind shift: now blowing " + next.label + ".", "danger");
        }
        const wind = engine.wind;
        const spreadRate = 0.55;
        const buf = engine._fireBuf;
        for(let r=0;r<ROWS;r++){
          for(let c=0;c<COLS;c++){
            buf[r][c] = engine.hazard[r][c];
          }
        }
        for(let r=0;r<ROWS;r++){
          for(let c=0;c<COLS;c++){
            if(engine.walls[r][c]) continue;
            let cur = engine.hazard[r][c];
            if(cur >= 1) { buf[r][c] = 1; continue; }
            let gain = 0;
            [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{
              const nr = r+dy, nc = c+dx;
              if(nr<0||nc<0||nr>=ROWS||nc>=COLS) return;
              const nIntensity = engine.hazard[nr][nc];
              if(nIntensity > 0.3){
                const windBias = 1 + Math.max(0, (wind.x*dx + wind.y*dy)) * 1.3;
                gain += nIntensity * spreadRate * windBias * dt;
              }
            });
            buf[r][c] = PRITHVI.clamp(cur + gain, 0, 1);
          }
        }
        engine.hazard = buf;
      },

      modifyDrain(engine, drain, intensity){
        return engine.flags.hasMask ? drain*0.55 : drain;
      },

      onDrawScreen(engine, ctx){
        const w = engine.canvas.width;
        ctx.save();
        ctx.fillStyle = "rgba(20,10,5,0.55)";
        ctx.fillRect(w-150,10,140,34);
        ctx.strokeStyle="#ff7a45"; ctx.strokeRect(w-150,10,140,34);
        ctx.fillStyle="#ff7a45"; ctx.font="bold 12px sans-serif"; ctx.textAlign="left"; ctx.textBaseline="middle";
        const arrow = {EAST:"→",SOUTH:"↓",NORTH:"↑","SOUTH-EAST":"↘"}[engine.wind.label] || "→";
        ctx.fillText("WIND " + arrow + " " + engine.wind.label, w-142, 27);
        ctx.restore();
      },

      onHud(engine){ PRITHVI.drillUI.updateHud(engine, "Heat"); },
      onEnd(engine, result){ PRITHVI.drillUI.handleEnd(engine, result, "fire"); },
      onPauseToggle(engine, paused){ PRITHVI.drillUI.handlePause(paused); },
      onItem(engine, item){ PRITHVI.drillUI.refreshInventory(engine); },
    };
  }

  PRITHVI.scenarios = PRITHVI.scenarios || {};
  PRITHVI.scenarios.fire = {
    title:"Escape the Fire",
    subtitle:"Objective: clear the forest before the fire — pushed by shifting wind — reaches you.",
    buildConfig,
    tips:[
      "If you can see fire or heavy smoke approaching, evacuate immediately — don't wait for an official order if you're already at risk.",
      "Move crosswind or away from the wind direction, never straight downwind of a spreading fire.",
      "Cover your nose and mouth with a mask or damp cloth to reduce smoke inhalation.",
      "Avoid dense, dry vegetation corridors — they carry fire fastest.",
    ],
  };

})();
