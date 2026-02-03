"""Lightweight HTTP server for emotion analysis."""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, HTTPServer

from emotion_engine import analyze_text


class EmotionHandler(BaseHTTPRequestHandler):
    def _set_headers(self) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._set_headers()

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/analyze":
            self.send_error(404, "Not Found")
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length)

        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            payload = {}

        text = str(payload.get("text", ""))
        result = analyze_text(text).to_dict()

        self._set_headers()
        self.wfile.write(json.dumps(result).encode("utf-8"))


def run(host: str = "0.0.0.0", port: int = 5000) -> None:
    server = HTTPServer((host, port), EmotionHandler)
    print(f"Emotion server running on http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run()
