/* ==========================================================================
   App bootstrap. Every module wires its own DOMContentLoaded listener;
   this file just does final cross-cutting setup once everything exists.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", ()=>{
  // Guard: if localStorage was corrupted/unavailable, keep the app usable.
  if(!PRITHVI.state.progress || !Array.isArray(PRITHVI.state.progress.history)){
    PRITHVI.state.progress = { history: [] };
  }
});
