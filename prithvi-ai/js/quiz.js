/* ==========================================================================
   Quiz Center — scenario-based knowledge tests (separate from the drills)
   ========================================================================== */

(function(){

  const BANKS = {
    flood:[
      { topic:"Evacuation timing", q:"A flood warning has just been issued for your riverside neighbourhood, but the streets are still dry. What should you do?", opts:[
        "Wait until water actually appears in the street before deciding",
        "Begin moving to higher ground or an upper floor now",
        "Go check on the river level up close first",
        "Continue your normal routine until told to stop"
      ], correct:1, explain:"Warnings are issued before conditions become dangerous specifically so you have time to move before water arrives — waiting removes that safety margin." },
      { topic:"Water hazards", q:"You need to get to a shelter, but the shortest route has about 20cm of fast-moving water across the road. What's the safest choice?", opts:[
        "Drive through carefully, keeping to the centre of the road",
        "Walk through quickly holding onto a rope or rail",
        "Take a longer route that avoids the water entirely",
        "Wait at the edge until the water looks calmer"
      ], correct:2, explain:"Just 15–30cm of moving water can sweep away a person or stall/float a vehicle. A longer dry route is safer even if it costs time." },
      { topic:"Evacuation timing", q:"Which of these is the best trigger to actually leave your home during a flood event?", opts:[
        "An official flood warning or visible rapid water rise nearby",
        "When neighbours start posting about it on social media",
        "When water is already inside your house",
        "When you personally feel like conditions look bad"
      ], correct:0, explain:"Acting on an official warning or a clearly rising water level gives you the most time to reach safety — waiting for water inside the home is too late." },
      { topic:"Hazard awareness", q:"While wading near a flooded area, you notice a downed power line partially in a puddle. What should you do?", opts:[
        "Step around it carefully, staying a few centimetres away",
        "Avoid the entire puddle and area, and report it if possible",
        "Use a dry stick to move the line out of the way",
        "It's fine as long as you're wearing shoes"
      ], correct:1, explain:"Water can conduct electricity from a live wire well beyond the wire itself. The only safe move is to stay well clear of the whole area." },
      { topic:"Safe zones", q:"Your area's official flood shelter is a School Hall on a hill 2km away, and a nearby rooftop is much closer. Which should you head for, given time to choose?", opts:[
        "The rooftop, since it's closer and still above water",
        "The official shelter, since it has supplies, safety oversight and won't be flooded further",
        "Whichever one has more people already there",
        "Stay home and wait it out either way"
      ], correct:1, explain:"Rooftops can become isolated with no supplies or rescue access. An official shelter on high ground is the safer target when you have time to reach it." },
    ],
    fire:[
      { topic:"Evacuation timing", q:"You smell smoke and see a distant orange glow beyond the treeline near your home. No official alert has come yet. What should you do?", opts:[
        "Wait for an official evacuation order before doing anything",
        "Start preparing to leave and monitor closely — don't wait for the flames to be visible",
        "Go investigate how close the fire actually is",
        "Close the windows and assume you're safe indoors"
      ], correct:1, explain:"Wildfires can outrun official alerts, especially in windy conditions. Visible smoke or glow nearby is itself a strong signal to prepare to move." },
      { topic:"Wind & fire spread", q:"The wind is blowing from the west, pushing the fire east. Which direction is generally safest to evacuate?", opts:[
        "East, directly ahead of the fire, to get past it quickly",
        "West, straight into the wind and fire origin",
        "North or south, crosswind, away from the fire's path",
        "It doesn't matter which direction you choose"
      ], correct:2, explain:"Moving crosswind gets you out of the fire's direct path fastest, since wind-driven fire spreads fastest in the downwind direction." },
      { topic:"Smoke protection", q:"You have to move through a smoky area briefly to reach open ground. What's the best protection available?", opts:[
        "Hold your breath as long as possible",
        "Cover your nose and mouth with a mask or damp cloth",
        "Breathe normally, smoke exposure for a minute won't matter",
        "Run as fast as possible without covering your face"
      ], correct:1, explain:"A mask or damp cloth meaningfully reduces the smoke and particulates you inhale during short exposure while moving to safety." },
      { topic:"Route selection", q:"Choosing an evacuation route through a forest fire zone, which path is generally riskiest?", opts:[
        "An already-burned, cleared area",
        "A wide dirt road with little vegetation",
        "A dense, dry, unburned vegetation corridor",
        "Open grassland with short grass"
      ], correct:2, explain:"Dense dry vegetation carries fire fastest and offers the least visibility and escape room if the fire front shifts toward you." },
      { topic:"Safe zones", q:"Once clear of the fire, where should you head?", opts:[
        "Any nearby building, regardless of distance from the treeline",
        "A designated open-ground assembly point away from the treeline and smoke path",
        "Back toward the fire to check if it's spreading further",
        "The closest parking lot, even if it's near the forest edge"
      ], correct:1, explain:"An official open-ground assembly point away from vegetation and the smoke plume is the safest confirmed destination." },
    ],
    pollution:[
      { topic:"AQI thresholds", q:"The AQI in your city has just crossed into the 'unhealthy' range. What's the most appropriate response?", opts:[
        "Go ahead with your usual outdoor run as planned",
        "Limit outdoor exertion and consider wearing a mask outside",
        "Open all windows to let the air circulate",
        "No change needed unless AQI is 'hazardous'"
      ], correct:1, explain:"At 'unhealthy' AQI levels, reducing outdoor exertion and using a mask outdoors meaningfully cuts your particulate exposure." },
      { topic:"Exposure reduction", q:"Which of these best reduces your personal exposure on a high-AQI day?", opts:[
        "A loosely wrapped cotton scarf over your face",
        "A well-fitted mask rated for fine particulates",
        "Sunglasses",
        "Chewing gum"
      ], correct:1, explain:"Fine particulate matter (PM2.5) passes through loose fabric easily; a properly fitted particulate-rated mask filters it far more effectively." },
      { topic:"Route selection", q:"Walking across the city on a high-pollution day, which route generally exposes you to less pollution?", opts:[
        "The main arterial road with heavy traffic",
        "A quieter backstreet away from traffic and factories",
        "Whichever is shortest, distance matters more than route",
        "Standing near a bus stop to wait it out"
      ], correct:1, explain:"Traffic corridors and industrial areas are concentrated pollution sources; routing away from them lowers cumulative exposure." },
      { topic:"Indoor protection", q:"Indoor AQI is noticeably better than outside, but you want to keep it that way. What should you do?", opts:[
        "Keep windows open for fresh air circulation",
        "Keep windows shut and run an air purifier if available",
        "It doesn't matter, indoor and outdoor air mix quickly anyway",
        "Burn incense to mask outdoor smells"
      ], correct:1, explain:"Sealing the indoor space and filtering the air keeps outdoor particulates from building up inside." },
      { topic:"AQI thresholds", q:"Who should be most cautious about even moderate increases in AQI?", opts:[
        "Only people who already have a respiratory diagnosis",
        "Only outdoor athletes",
        "Children, older adults, and people with heart or lung conditions",
        "AQI changes affect everyone identically regardless of health"
      ], correct:2, explain:"Children, older adults and those with existing heart or lung conditions are disproportionately affected even at moderate AQI increases." },
    ],
  };

  let hazard = null, idx = 0, answers = [], locked = false;

  function startQuiz(h){
    hazard = h; idx = 0; answers = [];
    document.getElementById("quiz-select-grid").classList.add("hidden");
    document.getElementById("quiz-player").classList.remove("hidden");
    document.getElementById("quiz-question-panel").classList.remove("hidden");
    document.getElementById("quiz-result-panel").classList.add("hidden");
    renderQuestion();
  }

  function renderQuestion(){
    locked = false;
    const bank = BANKS[hazard];
    const item = bank[idx];
    document.getElementById("quiz-progress").textContent = `Question ${idx+1} / ${bank.length} — ${PRITHVI.HAZARD_LABEL[hazard]}`;
    document.getElementById("quiz-question-text").textContent = item.q;
    const optsWrap = document.getElementById("quiz-options");
    optsWrap.innerHTML = "";
    item.opts.forEach((opt,i)=>{
      const b = document.createElement("button");
      b.className = "quiz-opt";
      b.textContent = opt;
      b.addEventListener("click", ()=> selectAnswer(i));
      optsWrap.appendChild(b);
    });
    document.getElementById("quiz-explain").classList.add("hidden");
    document.getElementById("quiz-next").classList.add("hidden");
  }

  function selectAnswer(i){
    if(locked) return;
    locked = true;
    const bank = BANKS[hazard];
    const item = bank[idx];
    const correct = i === item.correct;
    answers.push({ topic:item.topic, correct });

    document.querySelectorAll("#quiz-options .quiz-opt").forEach((btn,bi)=>{
      btn.disabled = true;
      if(bi === item.correct) btn.classList.add("correct");
      else if(bi === i) btn.classList.add("wrong");
    });

    const explain = document.getElementById("quiz-explain");
    explain.classList.remove("hidden");
    explain.innerHTML = `<b>${correct ? "Correct." : "Not quite."}</b> ${item.explain}`;

    document.getElementById("quiz-next").classList.remove("hidden");
    document.getElementById("quiz-next").textContent = (idx === bank.length-1) ? "See Results" : "Next Question";
  }

  function nextQuestion(){
    const bank = BANKS[hazard];
    if(idx < bank.length-1){ idx++; renderQuestion(); }
    else showResults();
  }

  function showResults(){
    const bank = BANKS[hazard];
    const correctCount = answers.filter(a=>a.correct).length;
    const accuracy = Math.round((correctCount/bank.length)*100);

    document.getElementById("quiz-question-panel").classList.add("hidden");
    document.getElementById("quiz-result-panel").classList.remove("hidden");
    document.getElementById("quiz-score").textContent = `${correctCount}/${bank.length}`;
    document.getElementById("quiz-accuracy").textContent = accuracy + "%";

    // topic-wise mistakes
    const mistakesByTopic = {};
    answers.forEach(a=>{ if(!a.correct) mistakesByTopic[a.topic] = (mistakesByTopic[a.topic]||0)+1; });
    const topics = Object.keys(mistakesByTopic);
    const weakest = topics.sort((a,b)=>mistakesByTopic[b]-mistakesByTopic[a])[0];
    document.getElementById("quiz-weak-topic").textContent = weakest || "None";

    const recs = document.getElementById("quiz-recommendations");
    const recList = [];
    if(weakest) recList.push(`Review "${weakest}" — this is where most of your missed questions came from. Try the ${PRITHVI.HAZARD_LABEL[hazard]} Safety Academy module for a refresher.`);
    if(accuracy === 100) recList.push("Perfect score — try the matching drill to put this knowledge into practice under time pressure.");
    else if(accuracy >= 60) recList.push("Solid grasp of the fundamentals. Revisit the missed questions' explanations above before your next attempt.");
    else recList.push("Consider watching the Safety Academy module for this hazard before retaking the quiz.");
    document.getElementById("quiz-recommendations").innerHTML = recList.map(r=>`<li>${r}</li>`).join("");

    PRITHVI.recordActivity({
      type:"quiz", hazard, result: accuracy>=60 ? "pass" : "fail", score:accuracy,
      meta:{ correct:correctCount, total:bank.length, weakest }
    });
    PRITHVI.toast("Quiz results saved to Performance.", accuracy>=60?"safe":"danger");
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    document.querySelectorAll("[data-open-quiz]").forEach(btn=>{
      btn.addEventListener("click", ()=> startQuiz(btn.dataset.openQuiz));
    });
    document.getElementById("quiz-next").addEventListener("click", nextQuestion);
    document.getElementById("quiz-retry").addEventListener("click", ()=> startQuiz(hazard));
    document.getElementById("quiz-back").addEventListener("click", ()=>{
      document.getElementById("quiz-player").classList.add("hidden");
      document.getElementById("quiz-select-grid").classList.remove("hidden");
    });
  });

})();
