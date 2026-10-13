#!/usr/bin/env python3
"""שרת מקומי לדף הנחיתה + קליטת הערות מהעמוד (POST /__notes)."""
import json, os, datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
NOTES = os.path.join(ROOT, "הערות.md")
PORT = 8787


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def do_POST(self):
        if self.path != "/__notes":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", 0))
        try:
            payload = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            self.send_error(400)
            return
        stamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        with open(NOTES, "a", encoding="utf-8") as fh:
            fh.write("\n\n<!-- ==== %s ==== -->\n\n" % stamp)
            fh.write(payload.get("markdown", ""))
        body = json.dumps({"ok": True, "file": os.path.basename(NOTES)}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    print("http://localhost:%d  ·  הערות נשמרות ל־%s" % (PORT, os.path.basename(NOTES)))
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
