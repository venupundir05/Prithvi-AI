(function(){

  const VIDEO_IDS = {
    flood:      "pi_nUPcQz_A",
    fire:       "NQIm4b-SUSg",
    pollution:  "MQhf5Su7fqk",
  };

  const TITLES = {
    flood:      "Flood Safety",
    fire:       "Forest Fire Safety",
    pollution:  "Pollution Safety",
  };

  function openVideo(hazard){
    const panel = document.getElementById("academy-player");
    const container = document.getElementById("drill-visual-container");
    const videoId = VIDEO_IDS[hazard];

    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
        <h2 style="font-family:var(--font-head);font-size:18px;margin:0;">${TITLES[hazard] || "Training Video"}</h2>
        <button class="btn btn-ghost btn-sm" id="academy-yt-close">✕ Close</button>
      </div>
      <div style="position:relative;width:100%;padding-top:56.25%;border-radius:10px;overflow:hidden;border:1px solid var(--border-soft);background:#000;">
        <iframe
          src="https://www.youtube.com/embed/${videoId}?rel=0"
          title="${TITLES[hazard] || "Training video"}"
          style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      </div>
    `;

    panel.classList.remove("hidden");
    document.getElementById("academy-yt-close").addEventListener("click", ()=>{
      container.innerHTML = "";
      panel.classList.add("hidden");
    });

    panel.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    document.querySelectorAll("[data-open-academy]").forEach(btn=>{
      btn.addEventListener("click", ()=> openVideo(btn.dataset.openAcademy));
    });
  });

})();