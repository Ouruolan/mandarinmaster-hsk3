// ================= USER STATE =================

let user = JSON.parse(localStorage.getItem("mm_user")) || {
  xp: 0,
  hearts: 3,
  unlockedUnits: [1]
};

function saveUser() {
  localStorage.setItem("mm_user", JSON.stringify(user));
}

// ================= TRANSITION SYSTEM =================

function renderScreen(html) {
  const app = document.getElementById("app");

  app.classList.add("fade-out");

  setTimeout(() => {
    app.innerHTML = html;
    app.classList.remove("fade-out");
    app.classList.add("fade-in");
  }, 150);
}

// ================= INIT =================

const params = new URLSearchParams(window.location.search);
const unitId = params.get("unit");

if (unitId) {
  loadUnit(parseInt(unitId));
} else {
  showSplash();
}

function showSplash() {

  let html = `
    <div class="splash">
      <div class="logo">🐼✨</div>
      <h1>MandarinMaster</h1>
      <h2>HSK 3.0</h2>
      <p>Aprende chino de forma divertida y oficial</p>
      <button onclick="loadMap()">🌸 Comenzar</button>
    </div>
  `;

  renderScreen(html);
}


// ================= MAP =================

function loadMap() {
  fetch("data/hsk1_3_0.json")
    .then(res => res.json())
    .then(data => renderMap(data));
}

function renderMap(data) {

  let html = `
    <div class="status">
      ⭐ XP: ${user.xp}
      ❤️ ${user.hearts}
    </div>
    <h2>🗺️ Mapa de Misiones HSK 3.0</h2>
  `;

  data.units.forEach(unit => {

    let locked = !user.unlockedUnits.includes(unit.id);

    html += `
      <div class="unit ${locked ? "locked" : ""}">
        <h3>${unit.title}</h3>
        <p>Palabras: ${unit.vocab.length}</p>
        ${
          locked
            ? "<button disabled>🔒 Bloqueado</button>"
            : `<button onclick="enterUnit(${unit.id})">🚀 Entrar</button>`
        }
      </div>
    `;
  });

  renderScreen(html);
}

function enterUnit(id) {
  window.location.href = "index.html?unit=" + id;
}

// ================= UNIT =================

function loadUnit(id) {

  fetch("data/hsk1_3_0.json")
    .then(res => res.json())
    .then(data => {

      const unit = data.units.find(u => u.id === id);
      if (!unit) return;

      let current = 0;

      function renderCard() {

        const word = unit.vocab[current];

        let html = `
          <div class="status">
            ⭐ XP: ${user.xp}
            ❤️ ${user.hearts}
          </div>

          <h2>${unit.title}</h2>

          <div class="card">
            <div class="hanzi">${word.hz}</div>
            <div class="pinyin">${word.py}</div>
            <div class="meaning">${word.es}</div>

            <button onclick="speakChinese('${word.hz}')">🔊 Escuchar</button>
            <button onclick="startRecording('${word.hz}')">🎤 Pronunciar</button>
          </div>

          <button onclick="nextCard()">Siguiente</button>
        `;

        renderScreen(html);
        setTimeout(() => speakChinese(word.hz), 300);
      }

      window.nextCard = function() {

        current++;

        if (current >= unit.vocab.length) {

          user.xp += 20;

          if (!user.unlockedUnits.includes(id + 1)) {
            user.unlockedUnits.push(id + 1);
          }

          saveUser();
          showCelebration();

        } else {
          renderCard();
        }
      };

      renderCard();
    });
}

// ================= CELEBRATION =================

function showCelebration() {

  playSuccessSound();

  let html = `
  <div class="celebration">
    <div class="logo">🎉🐼🎉</div>
    <h2>¡Unidad Superada!</h2>
    <p>¡Sigue así! 🌸</p>
    <button onclick="goBack()">Continuar ✨</button>
  </div>
`;

  renderScreen(html);
  createConfetti();
}

function goBack() {
  window.location.href = "index.html";
}

function createConfetti() {

  const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#a855f7"];

  for (let i = 0; i < 40; i++) {

    let confetti = document.createElement("div");
    confetti.className = "confetti-piece";

    confetti.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];

    confetti.style.left = Math.random() * 100 + "vw";
    confetti.style.width = Math.random() * 8 + 5 + "px";
    confetti.style.height = Math.random() * 8 + 5 + "px";
    confetti.style.animationDuration =
      (Math.random() * 2 + 2) + "s";

    document.body.appendChild(confetti);

    setTimeout(() => confetti.remove(), 3000);
  }
}

// ================= AUDIO =================

function speakChinese(text) {

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = "zh-CN";
  utterance.rate = 0.65;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voices = speechSynthesis.getVoices();
  const chineseVoice = voices.find(v => v.lang.includes("zh"));

  if (chineseVoice) {
    utterance.voice = chineseVoice;
  }

  speechSynthesis.speak(utterance);
}

function playSuccessSound() {
  const audio = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3");
  audio.play();
}

// ================= SPEECH RECOGNITION =================

function startRecording(correctWord) {

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    showToast("Tu navegador no soporta reconocimiento de voz", "error");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "zh-CN";

  recognition.start();

  recognition.onresult = function(event) {
    const spoken = event.results[0][0].transcript;

    if (spoken.includes(correctWord)) {
      user.xp += 5;
      saveUser();
      showToast("🎤 ¡Buena pronunciación! +5 XP", "success");
    } else {
      showToast("⚠️ Intenta de nuevo", "error");
    }
  };
}

// ================= TOAST =================

function showToast(message, type = "success") {

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
toast.style.transform += " scale(1.1)";
  }, 50);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}


