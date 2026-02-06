const canvas = document.getElementById("emotion-canvas");
const ctx = canvas.getContext("2d");
const input = document.getElementById("emotion-input");
const emotionName = document.getElementById("emotion-name");
const emotionMeta = document.getElementById("emotion-meta");

const EMOTION_STYLES = {
  neutral: {
    palette: ["#2a2f45", "#5b6a9b", "#8799c5"],
    speed: 0.6,
    wave: 22,
  },
  melancholic: {
    palette: ["#1c2c3a", "#3f5675", "#6c7ea7"],
    speed: 0.4,
    wave: 28,
  },
  "melancholic-hope": {
    palette: ["#1d2d45", "#455f9e", "#a4b8ff"],
    speed: 0.55,
    wave: 26,
  },
  hope: {
    palette: ["#2d3b5f", "#6f87d4", "#c5d4ff"],
    speed: 0.8,
    wave: 20,
  },
  joy: {
    palette: ["#f76c6c", "#fdd56a", "#ff9ff3"],
    speed: 1.2,
    wave: 18,
  },
  calm: {
    palette: ["#1c3b46", "#2f6f7a", "#74bfc9"],
    speed: 0.5,
    wave: 30,
  },
  anger: {
    palette: ["#4a0d0d", "#c72f2f", "#ff7d3a"],
    speed: 1.4,
    wave: 14,
  },
  fear: {
    palette: ["#2b223f", "#4d3b78", "#8a6fd1"],
    speed: 0.9,
    wave: 24,
  },
};

let currentStyle = EMOTION_STYLES.neutral;
let intensity = 0.0;
let energy = "steady";
let particles = [];

const resizeCanvas = () => {
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(devicePixelRatio, devicePixelRatio);
};

const createParticles = () => {
  const count = Math.min(180, 80 + Math.floor(intensity * 120));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: 1 + Math.random() * (2 + intensity * 3),
    speed: 0.4 + Math.random() * (1.2 + intensity),
    drift: Math.random() * Math.PI * 2,
  }));
};

const updateEmotion = (payload) => {
  const key = payload.emotion in EMOTION_STYLES ? payload.emotion : "neutral";
  currentStyle = EMOTION_STYLES[key];
  intensity = payload.intensity || 0;
  energy = payload.energy || "steady";
  emotionName.textContent = payload.emotion;
  emotionMeta.textContent = `intensity ${intensity.toFixed(2)} · ${energy}`;
  createParticles();
};

const analyzeLocal = (text) => {
  const lower = text.toLowerCase();
  if (!lower.trim()) {
    return { emotion: "neutral", intensity: 0, energy: "steady" };
  }

  const score = (words) => words.reduce((acc, word) => acc + (lower.includes(word) ? 1 : 0), 0);
  const calm = score(["calm", "still", "soft", "gentle", "breathe", "float"]);
  const joy = score(["joy", "happy", "warm", "glow", "smile", "delight"]);
  const anger = score(["angry", "rage", "fury", "sharp", "storm", "burn"]);
  const melancholic = score(["heavy", "sad", "lonely", "tired", "dark"]);
  const hope = score(["hope", "hopeful", "rise", "light", "promise"]);
  const fear = score(["fear", "anxious", "nervous", "tense", "shadow"]);

  const scores = { calm, joy, anger, melancholic, hope, fear };
  let topEmotion = "neutral";
  let topScore = 0;
  for (const [emotion, value] of Object.entries(scores)) {
    if (value > topScore) {
      topScore = value;
      topEmotion = emotion;
    }
  }

  let emotion = topEmotion;
  if (melancholic && hope) {
    emotion = "melancholic-hope";
  }

  const intensityValue = Math.min(1, 0.2 + topScore / 5 + text.length / 200);
  const energyValue = topEmotion === "hope" ? "low-rising" : "steady";

  return { emotion, intensity: intensityValue, energy: energyValue };
};

let debounceTimer;
const requestAnalysis = (text) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    try {
      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        throw new Error("Invalid response");
      }
      const data = await response.json();
      updateEmotion(data);
    } catch (error) {
      updateEmotion(analyzeLocal(text));
    }
  }, 120);
};

const draw = (time) => {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  const gradient = ctx.createLinearGradient(0, 0, window.innerWidth, window.innerHeight);
  gradient.addColorStop(0, currentStyle.palette[0]);
  gradient.addColorStop(0.5, currentStyle.palette[1]);
  gradient.addColorStop(1, currentStyle.palette[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  const waveHeight = currentStyle.wave + intensity * 40;
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";

  ctx.beginPath();
  for (let x = 0; x <= window.innerWidth; x += 10) {
    const y =
      window.innerHeight / 2 +
      Math.sin((x / 80) + time * 0.001 * currentStyle.speed) * waveHeight;
    ctx.lineTo(x, y);
  }
  ctx.stroke();

  particles.forEach((particle) => {
    particle.y += Math.sin(time * 0.001 * particle.speed + particle.drift) * 0.6;
    particle.x += Math.cos(time * 0.001 * particle.speed + particle.drift) * 0.4;

    if (particle.x < 0) particle.x = window.innerWidth;
    if (particle.x > window.innerWidth) particle.x = 0;
    if (particle.y < 0) particle.y = window.innerHeight;
    if (particle.y > window.innerHeight) particle.y = 0;

    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + intensity * 0.6})`;
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  requestAnimationFrame(draw);
};

window.addEventListener("resize", () => {
  resizeCanvas();
  createParticles();
});

input.addEventListener("input", (event) => {
  requestAnalysis(event.target.value);
});

resizeCanvas();
createParticles();
requestAnalysis("");
requestAnimationFrame(draw);
