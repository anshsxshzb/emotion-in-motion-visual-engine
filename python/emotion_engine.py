"""Emotion analysis engine for the Emotion → Motion visual engine."""

from __future__ import annotations

import math
from dataclasses import dataclass


EMOTION_KEYWORDS = {
    "melancholic": {
        "sad",
        "heavy",
        "lonely",
        "tired",
        "quiet",
        "dark",
        "gloom",
    },
    "hope": {
        "hope",
        "hopeful",
        "bright",
        "rise",
        "rising",
        "light",
        "promise",
    },
    "joy": {"joy", "happy", "warm", "glow", "smile", "delight"},
    "calm": {"calm", "still", "breathe", "soft", "gentle", "float"},
    "anger": {"angry", "rage", "fury", "sharp", "burn", "storm"},
    "fear": {"fear", "anxious", "nervous", "tense", "worry", "shadow"},
}

ENERGY_MAP = {
    "melancholic": "low",
    "hope": "rising",
    "joy": "high",
    "calm": "low-steady",
    "anger": "high",
    "fear": "uneasy",
}


@dataclass(frozen=True)
class EmotionResult:
    emotion: str
    intensity: float
    energy: str

    def to_dict(self) -> dict[str, float | str]:
        return {
            "emotion": self.emotion,
            "intensity": round(self.intensity, 2),
            "energy": self.energy,
        }


def _tokenize(text: str) -> list[str]:
    return [token.strip(".,!?;:\"'()[]{}").lower() for token in text.split()]


def analyze_text(text: str) -> EmotionResult:
    """Analyze text for a simple emotion + intensity signal."""
    tokens = _tokenize(text)
    if not tokens:
        return EmotionResult("neutral", 0.0, "steady")

    scores: dict[str, int] = {emotion: 0 for emotion in EMOTION_KEYWORDS}

    for token in tokens:
        for emotion, keywords in EMOTION_KEYWORDS.items():
            if token in keywords:
                scores[emotion] += 1

    top_emotion = max(scores, key=scores.get)
    total_hits = sum(scores.values())
    intensity = 0.0
    if total_hits:
        intensity = scores[top_emotion] / total_hits

    # Add a gentle scale so longer text feels more intense.
    intensity = min(1.0, intensity + math.log(len(tokens) + 1, 10))

    if scores[top_emotion] == 0:
        return EmotionResult("neutral", 0.15, "steady")

    if top_emotion == "melancholic" and scores["hope"]:
        emotion = "melancholic-hope"
        energy = "low-rising"
    else:
        emotion = top_emotion
        energy = ENERGY_MAP.get(top_emotion, "steady")

    return EmotionResult(emotion, intensity, energy)


if __name__ == "__main__":
    sample = "I feel heavy but hopeful."
    print(analyze_text(sample).to_dict())
