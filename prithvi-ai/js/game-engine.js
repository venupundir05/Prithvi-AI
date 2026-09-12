/* ==========================================================================
   PRITHVI AI — Shared Disaster-Drill Game Engine
   One engine, three scenarios (flood.js / fire.js / pollution.js supply a
   config object). Handles: WASD/arrow movement with acceleration + friction,
   tile collision, camera follow, a per-cell hazard-intensity grid that each
   scenario evolves over time, item pickup with E, health drain while
   standing in hazard, timer, scoring, and win/lose.
   ========================================================================== */

(function(){

  const TILE = 40;

  function makeGrid(cols, rows, fill){
    const g = [];
    for(let r=0;r<rows;r++){ g.push(new Array(cols).fill(fill)); }
    return g;
  }

  class DrillEngine{
    constructor(canvas, config){
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.cfg = config;
      this.cols = config.cols;
      this.rows = config.rows;
      this.worldW = this.cols*TILE;
      this.worldH = this.rows*TILE;
      this.walls = config.walls || makeGrid(this.cols,this.rows,0);
      this.hazard = makeGrid(this.cols,this.rows,0);
      this.items = (config.items||[]).map(it=>Object.assign({collected:false,radius:16}, it));
      this.safeZone = config.safeZone;
      this.flags = {};
      this.keys = {};
      this.running = false;
      this.paused = false;
      this.elapsed = 0;
      this.health = 100;
      this.score = 0;
      this.result = null; // 'win' | 'lose'
      this.lastTs = null;
      this.player = {
        x: config.start.x, y: config.start.y,
        vx:0, vy:0, w:22, h:22, facing:"down",
      };
      this._bindKeys();
      this._raf = this._raf.bind(this);
    }

    _bindKeys(){
      this._onDown = (e)=>{
        if(!this.running) return;
        const k = e.key.toLowerCase();
        if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright","e","p"].includes(k)){
          e.preventDefault();
        }
        this.keys[k] = true;
        if(k === "e") this._tryInteract();
        if(k === "p") this.togglePause();
      };
      this._onUp = (e)=>{ this.keys[e.key.toLowerCase()] = false; };
      window.addEventListener("keydown", this._onDown);
      window.addEventListener("keyup", this._onUp);
    }

    destroy(){
      window.removeEventListener("keydown", this._onDown);
      window.removeEventListener("keyup", this._onUp);
      this.running = false;
    }

    start(){
      this.running = true;
      this.paused = false;
      this.elapsed = 0;
      this.health = 100;
      this.score = 0;
      this.result = null;
      this.flags = {};
      this.items.forEach(it=>it.collected=false);
      this.player.x = this.cfg.start.x;
      this.player.y = this.cfg.start.y;
      this.player.vx = 0; this.player.vy = 0;
      this.hazard = makeGrid(this.cols,this.rows,0);
      if(this.cfg.onStart) this.cfg.onStart(this);
      this.lastTs = null;
      requestAnimationFrame(this._raf);
    }

    stop(){ this.running = false; }
    pauseIfRunning(){ if(this.running && !this.result) this.paused = true; }
    togglePause(){
      if(!this.running || this.result) return;
      this.paused = !this.paused;
      if(this.cfg.onPauseToggle) this.cfg.onPauseToggle(this, this.paused);
    }

    tileAt(px,py){
      const c = Math.floor(px/TILE), r = Math.floor(py/TILE);
      if(r<0||c<0||r>=this.rows||c>=this.cols) return {c,r,wall:1,hazard:0};
      return { c, r, wall:this.walls[r][c], hazard:this.hazard[r][c] };
    }

    isWallRect(x,y,w,h){
      const c0 = Math.floor(x/TILE), c1 = Math.floor((x+w)/TILE);
      const r0 = Math.floor(y/TILE), r1 = Math.floor((y+h)/TILE);
      for(let r=r0;r<=r1;r++){
        for(let c=c0;c<=c1;c++){
          if(r<0||c<0||r>=this.rows||c>=this.cols) return true;
          if(this.walls[r][c]===1) return true;
        }
      }
      return false;
    }

    _tryInteract(){
      const p = this.player;
      for(const it of this.items){
        if(it.collected) continue;
        const dx = (p.x+p.w/2)-it.x, dy=(p.y+p.h/2)-it.y;
        if(Math.hypot(dx,dy) < it.radius+22){
          it.collected = true;
          this.score += it.score || 60;
          if(it.onCollect) it.onCollect(this);
          if(this.cfg.onItem) this.cfg.onItem(this, it);
          return;
        }
      }
    }

    _physics(dt){
      const p = this.player;
      const accel = 1400, maxSpeed = 195, friction = 8.5;
      let ix=0, iy=0;
      if(this.keys["w"]||this.keys["arrowup"]) iy -= 1;
      if(this.keys["s"]||this.keys["arrowdown"]) iy += 1;
      if(this.keys["a"]||this.keys["arrowleft"]) ix -= 1;
      if(this.keys["d"]||this.keys["arrowright"]) ix += 1;
      if(ix||iy){
        const len = Math.hypot(ix,iy)||1;
        ix/=len; iy/=len;
        if(Math.abs(ix) > Math.abs(iy)) p.facing = ix>0?"right":"left";
        else p.facing = iy>0?"down":"up";
      }
      p.vx += ix*accel*dt; p.vy += iy*accel*dt;
      const speed = Math.hypot(p.vx,p.vy);
      if(speed > maxSpeed){ p.vx *= maxSpeed/speed; p.vy *= maxSpeed/speed; }
      const decay = Math.max(0, 1 - friction*dt);
      if(!ix) p.vx *= decay;
      if(!iy) p.vy *= decay;

      // axis-separated collision
      const nx = p.x + p.vx*dt;
      if(!this.isWallRect(nx, p.y, p.w, p.h)) p.x = nx; else p.vx = 0;
      const ny = p.y + p.vy*dt;
      if(!this.isWallRect(p.x, ny, p.w, p.h)) p.y = ny; else p.vy = 0;

      p.x = PRITHVI.clamp(p.x, 0, this.worldW-p.w);
      p.y = PRITHVI.clamp(p.y, 0, this.worldH-p.h);
    }

    _applyHazardDamage(dt){
      const p = this.player;
      const t = this.tileAt(p.x+p.w/2, p.y+p.h/2);
      const intensity = t.hazard || 0;
      if(intensity > 0.02){
        let drain = intensity * (this.cfg.drainRate||18) * dt;
        if(this.cfg.modifyDrain) drain = this.cfg.modifyDrain(this, drain, intensity);
        this.health -= drain;
      }
      this.health = PRITHVI.clamp(this.health, 0, 100);
    }

    _checkEnd(){
      if(this.result) return;
      const p = this.player;
      if(this.health <= 0){
        this._end("lose", this.cfg.loseMessages ? this.cfg.loseMessages.health : "Exposure became too severe to continue.");
        return;
      }
      if(this.cfg.timeLimit && this.elapsed >= this.cfg.timeLimit){
        this._end("lose", this.cfg.loseMessages ? this.cfg.loseMessages.time : "Conditions reached critical before you escaped.");
        return;
      }
      const sz = this.safeZone;
      if(sz && p.x+p.w > sz.x && p.x < sz.x+sz.w && p.y+p.h > sz.y && p.y < sz.y+sz.h){
        this._end("win", "You reached safety in time.");
      }
    }

    _end(result, message){
      this.result = result;
      this.running = false;
      this.endMessage = message;
      const itemsCollected = this.items.filter(i=>i.collected).length;
      let score = 0;
      if(result === "win"){
        score = Math.round(400 + this.health*3.2 + itemsCollected*90 - this.elapsed*2.4);
      } else {
        score = Math.round(this.health*1.2 + itemsCollected*40);
      }
      this.finalScore = Math.max(0, score);
      if(this.cfg.onEnd) this.cfg.onEnd(this, result);
    }

    _drawWorld(){
      const ctx = this.ctx;
      const p = this.player;
      const viewW = this.canvas.width, viewH = this.canvas.height;
      const camX = PRITHVI.clamp(p.x - viewW/2, 0, Math.max(0,this.worldW-viewW));
      const camY = PRITHVI.clamp(p.y - viewH/2, 0, Math.max(0,this.worldH-viewH));
      this.camera = {x:camX,y:camY};

      ctx.clearRect(0,0,viewW,viewH);
      ctx.save();
      ctx.translate(-camX,-camY);

      // ground
      ctx.fillStyle = this.cfg.groundColor || "#141b28";
      ctx.fillRect(0,0,this.worldW,this.worldH);
      // subtle grid
      ctx.strokeStyle = "rgba(255,255,255,0.035)";
      for(let x=0;x<=this.worldW;x+=TILE){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,this.worldH); ctx.stroke(); }
      for(let y=0;y<=this.worldH;y+=TILE){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(this.worldW,y); ctx.stroke(); }

      // hazard overlay
      const hc = this.cfg.hazardColor || [240,85,92];
      for(let r=0;r<this.rows;r++){
        for(let c=0;c<this.cols;c++){
          const h = this.hazard[r][c];
          if(h > 0.02){
            ctx.fillStyle = `rgba(${hc[0]},${hc[1]},${hc[2]},${Math.min(0.75,h*0.75)})`;
            ctx.fillRect(c*TILE, r*TILE, TILE, TILE);
          }
        }
      }

      // walls
      ctx.fillStyle = this.cfg.wallColor || "#2a3450";
      for(let r=0;r<this.rows;r++){
        for(let c=0;c<this.cols;c++){
          if(this.walls[r][c]===1){
            ctx.fillRect(c*TILE+1, r*TILE+1, TILE-2, TILE-2);
          }
        }
      }

      // safe zone
      if(this.safeZone){
        const sz = this.safeZone;
        ctx.fillStyle = "rgba(69,203,133,0.22)";
        ctx.fillRect(sz.x,sz.y,sz.w,sz.h);
        ctx.strokeStyle = "#45cb85"; ctx.lineWidth=2;
        ctx.strokeRect(sz.x,sz.y,sz.w,sz.h);
        ctx.fillStyle = "#45cb85"; ctx.font="bold 12px sans-serif"; ctx.textAlign="center";
        ctx.fillText("SAFE ZONE", sz.x+sz.w/2, sz.y-8);
      }

      // items
      this.items.forEach(it=>{
        if(it.collected) return;
        ctx.beginPath();
        ctx.arc(it.x,it.y,14,0,Math.PI*2);
        ctx.fillStyle = "#1a2332"; ctx.fill();
        ctx.strokeStyle = "#2fd9c4"; ctx.lineWidth=2; ctx.stroke();
        ctx.font="16px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText(it.icon||"?", it.x, it.y+1);
      });

      // scenario extra drawing (e.g. wind arrow, fire glow)
      if(this.cfg.onDraw) this.cfg.onDraw(this, ctx);

      // player
      ctx.save();
      ctx.translate(p.x+p.w/2, p.y+p.h/2);
      ctx.fillStyle = "#0a0e16";
      ctx.beginPath(); ctx.ellipse(0,p.h/2+4,p.w/2,5,0,0,Math.PI*2); ctx.fill(); // shadow
      ctx.fillStyle = this.cfg.playerColor || "#2fd9c4";
      ctx.beginPath(); ctx.arc(0,0,p.w/2,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#0a0e16"; ctx.lineWidth=2; ctx.stroke();
      // facing indicator
      const dir = {up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[p.facing];
      ctx.fillStyle="#0a0e16";
      ctx.beginPath(); ctx.arc(dir[0]*7, dir[1]*7, 3, 0, Math.PI*2); ctx.fill();
      ctx.restore();

      ctx.restore();

      // screen-space overlay (weather effects, wind indicators, etc.)
      if(this.cfg.onDrawScreen) this.cfg.onDrawScreen(this, ctx);
    }

    _raf(ts){
      if(!this.running){ return; }
      if(this.lastTs===null) this.lastTs = ts;
      let dt = (ts - this.lastTs)/1000;
      this.lastTs = ts;
      dt = Math.min(dt, 0.05);

      if(!this.paused){
        this.elapsed += dt;
        this._physics(dt);
        if(this.cfg.onUpdate) this.cfg.onUpdate(this, dt);
        this._applyHazardDamage(dt);
        this._checkEnd();
      }
      this._drawWorld();
      if(this.cfg.onHud) this.cfg.onHud(this);

      if(this.running) requestAnimationFrame(this._raf);
    }
  }

  PRITHVI.DrillEngine = DrillEngine;
  PRITHVI.TILE = TILE;
  PRITHVI.makeGrid = makeGrid;

})();
