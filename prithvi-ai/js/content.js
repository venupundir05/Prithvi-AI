/* ==========================================================================
   Shared static content used by dashboard.js and warnings.js
   ========================================================================== */

window.PRITHVI = window.PRITHVI || {};

PRITHVI.HAZARD_LABEL = { flood:"Flood", fire:"Forest Fire", pollution:"Pollution" };

PRITHVI.ALERT_INFO = {
  flood: {
    area:"Riverside Ward 4 & low-lying colonies",
    action:"Move to higher floors or designated high ground. Avoid walking or driving through moving water — 15cm can knock an adult over.",
    safeZone:"Community Hall, Ridge Road (2.1 km, high ground)",
    normalNote:"River gauges and rainfall sensors are within safe operating range.",
  },
  fire: {
    area:"Northern forest fringe settlements",
    action:"Prepare to evacuate downwind of the fire. Close windows, keep a mask or wet cloth ready, and stay clear of the treeline.",
    safeZone:"District Sports Complex, open ground (3.4 km)",
    normalNote:"Temperature, humidity and wind readings show low fire-spread risk.",
  },
  pollution: {
    area:"Central business district & arterial roads",
    action:"Limit outdoor activity, wear a mask outdoors, keep windows shut, and run air purifiers indoors if available.",
    safeZone:"Indoor shelter with filtered air — City Library Annex",
    normalNote:"AQI and particulate readings are in the satisfactory range.",
  },
};
