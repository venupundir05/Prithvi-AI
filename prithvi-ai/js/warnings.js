/* ==========================================================================
   Early Warnings view — full detail card per hazard
   ========================================================================== */

(function(){

  function levelLabel(level){
    return level === "high" ? "High Risk" : level.charAt(0).toUpperCase()+level.slice(1);
  }

  function card(hazard, s){
    const level = s.risk[hazard];
    const info = PRITHVI.ALERT_INFO[hazard];
    const trendWord = s.trend[hazard] === "up" ? "Rising" : (s.trend[hazard]==="down" ? "Falling" : "Stable");
    const bannerClass = level === "normal" ? "safe" : (level === "warning" ? "warning" : "");
    const v = s.values[hazard];

    let conditionsLine = "";
    if(hazard === "flood") conditionsLine = `Water level ${v.waterLevel.toFixed(1)} m, rising ${v.riseRate.toFixed(2)} m/h, rainfall ${v.rainfall.toFixed(0)} mm/h`;
    if(hazard === "fire") conditionsLine = `${v.temperature.toFixed(0)}°C, ${v.humidity.toFixed(0)}% humidity, smoke ${v.smoke.toFixed(0)}%, wind ${v.wind.toFixed(0)} km/h`;
    if(hazard === "pollution") conditionsLine = `AQI ${v.aqi.toFixed(0)}, PM2.5 ${v.pm25.toFixed(0)} µg/m³, visibility ${v.visibility.toFixed(1)} km`;

    return `
      <div class="alert-banner ${bannerClass}">
        <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4"/><circle cx="12" cy="17" r="0.8" fill="currentColor"/></svg>
        <div style="flex:1">
          <div class="ab-title">${PRITHVI.HAZARD_LABEL[hazard]} — ${levelLabel(level)} <span style="color:var(--text-faint);font-weight:400;">(score ${s.riskScore[hazard].toFixed(0)}/100, ${trendWord.toLowerCase()})</span></div>
          <div class="ab-grid">
            <div style="grid-column:1/-1;"><b>Current conditions:</b> ${conditionsLine}</div>
            <div><b>Affected area:</b> ${level==="normal" ? "None — monitored zone stable" : info.area}</div>
            <div><b>Safe zone / shelter:</b> ${info.safeZone}</div>
            <div style="grid-column:1/-1;"><b>Recommended action:</b> ${level==="normal" ? info.normalNote : info.action}</div>
          </div>
        </div>
      </div>`;
  }

  function render(s){
    const list = document.getElementById("warnings-full-list");
    if(!list) return;
    list.innerHTML = PRITHVI.sensors.HAZARDS
      .slice()
      .sort((a,b)=> s.riskScore[b]-s.riskScore[a])
      .map(h=>card(h,s)).join("");
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    PRITHVI.sensors.subscribe(render);
    render(PRITHVI.sensors.getState());
  });

})();
