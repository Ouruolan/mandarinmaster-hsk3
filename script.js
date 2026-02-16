// ===================================
// MandarinMaster HSK 3.0
// Script estable con Toast bonito
// ===================================

// -------- USER STATE --------
let user = JSON.parse(localStorage.getItem("mm_user")) || {
  xp: 0,
  hearts: 3,
  unlockedUnits: [1],
  completedUnits: []
};

function saveUser() {
  localStorage.setItem("mm_user", JSON.stringify(user));
}

// -------- DATA --------
let HSK = null;
let currentUnit = null;

async function loadData() {
  if (HSK) return HSK;
  const res = await fetch("data/hsk1_3_0.json");
  HSK = await res.json();
  return HSK;
}

// -------- UI --------
function renderScreen(html) {
  const app = document.getElementById("app");
  app.innerHTML = html;
}

function topBar() {
  return `
    <div class="status">
      ⭐ XP: ${user.xp}
      ❤️ ${user.hearts}
    </div>
  `;
}

function go(url) {
  window.location.href = url;
}

// -------- ROUTER --------
async function router() {
  await loadData();

  const params = new URLSearchParams(window.location.search);
  const unitId = params.get("unit");
  const view = params.get("view");

  if (!unitId && !view) return showSplash();
  if (view === "map") return showMap();

  if (unitId) {
    currentUnit = HSK.units.find(u => u.id === parseInt(unitId));
    if (!currentUnit) return showMap();

    const v = view || "menu";

    if (v === "menu") return showUnitMenu();
    if (v === "vocab") return showVocab();
    if (v === "flash") return showFlashcards();
    if (v === "exercise") return showExercisesMenu();
    if (v === "write") return showWriting();
    if (v === "speak") return showSpeaking();
    if (v === "finish") return showCelebration();
  }

  return showMap();
}

// -------- SPLASH --------
function showSplash() {
  renderScreen(`
    <div class="splash">
      <div class="logo">🐼✨</div>
      <h1>MandarinMaster</h1>
      <h2>HSK 3.0</h2>
      <button onclick="go('index.html?view=map')">🌸 Empezar</button>
    </div>
  `);
}

// -------- MAP --------
function showMap() {
  let html = `
    ${topBar()}
    <h2>🗺️ Mapa de Misiones</h2>
  `;

  HSK.units.forEach(u => {
    const locked = !user.unlockedUnits.includes(u.id);

    html += `
      <div class="tile ${locked ? "locked" : ""}">
        <h3>${u.title}</h3>
        <p>Palabras: ${u.vocab.length}</p>
        ${
          locked
            ? `<button disabled>🔒 Bloqueado</button>`
            : `<button onclick="go('index.html?unit=${u.id}')">🚀 Entrar</button>`
        }
      </div>
    `;
  });

  renderScreen(html);
}

// -------- UNIT MENU --------
function showUnitMenu() {
  renderScreen(`
    ${topBar()}
    <button onclick="go('index.html?view=map')">⬅ Mapa</button>
    <h2>${currentUnit.title}</h2>

    <button onclick="go('index.html?unit=${currentUnit.id}&view=vocab')">📚 Vocabulario</button>
    <button onclick="go('index.html?unit=${currentUnit.id}&view=flash')">🃏 Flashcards</button>
    <button onclick="go('index.html?unit=${currentUnit.id}&view=exercise')">🧩 Ejercicios</button>
    <button onclick="go('index.html?unit=${currentUnit.id}&view=write')">✍️ Escritura</button>
    <button onclick="go('index.html?unit=${currentUnit.id}&view=speak')">🎤 Pronunciación</button>
    <button onclick="completeUnit()">🏁 Finalizar misión</button>
  `);
}

function completeUnit() {
  user.xp += 20;

  if (!user.completedUnits.includes(currentUnit.id))
    user.completedUnits.push(currentUnit.id);

  if (!user.unlockedUnits.includes(currentUnit.id + 1))
    user.unlockedUnits.push(currentUnit.id + 1);

  saveUser();
  go(`index.html?unit=${currentUnit.id}&view=finish`);
}

// -------- VOCAB --------
function showVocab() {

  let index = 0;

  function render() {
    const w = currentUnit.vocab[index];

    renderScreen(`
      ${topBar()}
      <button onclick="go('index.html?unit=${currentUnit.id}')">⬅</button>

      <div class="card">
        <h1 style="font-size:60px;">${w.hz}</h1>
        <p>${w.py}</p>
        <p>${w.es}</p>
      </div>

      <button onclick="speakChinese('${w.hz}')">🔊 Escuchar</button>
      <button onclick="next()">Siguiente ➡</button>
    `);
  }

  window.next = function() {
    if (index < currentUnit.vocab.length - 1) {
      index++;
      render();
    } else {
      showToast("🎉 Unidad completada", "success");
      go(`index.html?unit=${currentUnit.id}`);
    }
  };

  render();
}

// -------- FLASHCARDS --------
function showFlashcards() {
  let i = 0;

  function render() {
    const w = currentUnit.vocab[i];
    renderScreen(`
      ${topBar()}
      <button onclick="go('index.html?unit=${currentUnit.id}')">⬅</button>
      <div class="card">
        <div class="big">${w.hz}</div>
        <div>${w.py}</div>
        <div>${w.es}</div>
      </div>
      <button onclick="speakChinese('${w.hz}')">🔊 Escuchar</button>
      <button onclick="next()">Siguiente</button>
    `);
  }

  window.next = function () {
    i = (i + 1) % currentUnit.vocab.length;
    render();
  };

  render();
}

// -------- EXERCISES --------
function showExercisesMenu() {
  renderScreen(`
    ${topBar()}
    <button onclick="go('index.html?unit=${currentUnit.id}')">⬅</button>
    <h2>🧩 Ejercicios</h2>

    <button onclick="showOrderExercise()">🧱 Ordenar palabras</button>
    <button onclick="showBlankExercise()">🕳️ Palabra faltante</button>
  `);
}

function showOrderExercise() {

  // Elegir dos palabras aleatorias
  let shuffledWords = [...currentUnit.vocab]
    .sort(() => 0.5 - Math.random())
    .slice(0, 2);

  const tokens = shuffledWords.map(w => w.hz);
  const correct = tokens.join("");

  let shuffled = [...tokens].sort(() => 0.5 - Math.random());
  let built = [];

  function render() {
    renderScreen(`
      ${topBar()}
      <button onclick="showExercisesMenu()">⬅</button>
      <h2>🧱 Ordenar palabras</h2>

      <div style="margin:20px 0;font-size:24px;">
        ${built.join(" ") || "___"}
      </div>

      ${shuffled.map((t, i) =>
        `<button onclick="pick(${i})">${t}</button>`
      ).join("")}

      <button onclick="check()">Comprobar</button>
    `);
  }

  window.pick = function(index) {
    built.push(shuffled[index]);
    shuffled.splice(index, 1);
    render();
  };

  window.check = function() {
    if (built.join("") === correct) {
      user.xp += 10;
      saveUser();
      showToast("🎉 ¡Correcto! +10 XP", "success");
      setTimeout(() => showOrderExercise(), 800);
    } else {
      user.hearts--;
      saveUser();
      showToast("❌ Intenta otra vez", "error");

      if (user.hearts <= 0) {
        user.hearts = 3;
        showToast("💔 Sin vidas. Reiniciadas", "error");
      }
    }
  };

  render();
}

function showBlankExercise() {

  const randomIndex = Math.floor(Math.random() * currentUnit.vocab.length);
  const word = currentUnit.vocab[randomIndex];

  let options = currentUnit.vocab
    .map(w => w.hz)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);

  if (!options.includes(word.hz)) {
    options[0] = word.hz;
  }

  renderScreen(`
    ${topBar()}
    <button onclick="showExercisesMenu()">⬅</button>
    <h2>🕳️ Palabra faltante</h2>

    <p style="font-size:22px;margin:20px 0;">__ 好</p>

    ${options.map(o =>
      `<button onclick="checkBlank('${o}','${word.hz}')">${o}</button>`
    ).join("")}
  `);

  window.checkBlank = function(selected, correct) {

    if (selected === correct) {
      user.xp += 10;
      saveUser();
      showToast("🎉 ¡Correcto! +10 XP", "success");
      setTimeout(() => showBlankExercise(), 800);
    } else {
      user.hearts--;
      saveUser();
      showToast("❌ No es correcto", "error");

      if (user.hearts <= 0) {
        user.hearts = 3;
        showToast("💔 Sin vidas. Reiniciadas", "error");
      }
    }
  };
}

// -------- WRITING --------
function showWriting() {
  renderScreen(`
    ${topBar()}
    <button onclick="go('index.html?unit=${currentUnit.id}')">⬅</button>
    <h2>✍️ Escritura</h2>
    <p>Próximamente práctica con trazos reales.</p>
  `);
}

// -------- SPEAKING --------
function showSpeaking() {
  const w = currentUnit.vocab[0];

  renderScreen(`
    ${topBar()}
    <button onclick="go('index.html?unit=${currentUnit.id}')">⬅</button>
    <h2>🎤 Pronunciación</h2>
    <div class="big">${w.hz}</div>
    <button onclick="speakChinese('${w.hz}')">🔊 Escuchar</button>
  `);
}

// -------- CELEBRATION --------
function showCelebration() {
  renderScreen(`
    ${topBar()}
    <div class="celebration">
      <h2>🎉 ¡Misión completada!</h2>
      <button onclick="go('index.html?view=map')">Volver al mapa</button>
    </div>
  `);
}

// -------- AUDIO --------
function speakChinese(text) {
  speechSynthesis.cancel();

  const spacedText = text.split("").join(" ");

  const utterance = new SpeechSynthesisUtterance(spacedText);
  utterance.lang = "zh-CN";
  utterance.rate = 0.45;
  utterance.pitch = 1.25;
  utterance.volume = 1;

  const voices = speechSynthesis.getVoices();
  const zhVoice = voices.find(v => v.lang.toLowerCase().includes("zh"));

  if (zhVoice) {
    utterance.voice = zhVoice;
  }

  speechSynthesis.speak(utterance);
}

// -------- TOAST --------
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;

  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 50);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// -------- START --------
router();
