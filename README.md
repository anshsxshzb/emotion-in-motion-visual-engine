# Emotion → Motion Visual Engine

Type a feeling and watch a living canvas respond in real time. The project blends a lightweight Python emotion analyzer with a browser-based generative visualization.

## What’s inside

- **Python brain** – `python/emotion_engine.py` scores text and returns a simple emotion, intensity, and energy signal.
- **JavaScript soul** – `app.js` turns that signal into palettes, waves, and particle motion.
- **HTML + CSS body** – `index.html` and `styles.css` provide a full-screen canvas with a minimal text-only UI.

## Run it locally

1. Start the emotion analysis server:
   ```bash
   python python/emotion_server.py
   ```

2. In a second terminal, serve the front-end:
   ```bash
   python -m http.server 8080
   ```

3. Open the experience:
   ```
   http://localhost:8080
   ```

If the Python server is not running, the UI will fall back to a local heuristic emotion guesser.

## Example response

```json
{
  "emotion": "melancholic-hope",
  "intensity": 0.67,
  "energy": "low-rising"
}
```
