#!/usr/bin/env python3
"""שרת מקומי לסקיצה ב׳ של דף הנחיתה (לא דורס את site/ המקורי, פורט נפרד)."""
import os
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 8788


class Handler(SimpleHTTPRequestHandler):
    range = None

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def send_head(self):
        """Serve byte ranges so scroll-controlled MP4 seeking works locally."""
        path = self.translate_path(self.path)
        range_header = self.headers.get("Range")
        if not range_header or not os.path.isfile(path):
            self.range = None
            return super().send_head()

        match = re.match(r"bytes=(\d*)-(\d*)$", range_header.strip())
        if not match:
            self.send_error(416, "Requested Range Not Satisfiable")
            return None

        size = os.path.getsize(path)
        start_text, end_text = match.groups()
        start = int(start_text) if start_text else 0
        end = int(end_text) if end_text else size - 1
        end = min(end, size - 1)
        if start > end or start >= size:
            self.send_response(416)
            self.send_header("Content-Range", "bytes */%d" % size)
            self.end_headers()
            return None

        content_type = self.guess_type(path)
        source = open(path, "rb")
        source.seek(start)
        self.range = (start, end)
        self.send_response(206)
        self.send_header("Content-type", content_type)
        self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
        self.send_header("Content-Length", str(end - start + 1))
        self.send_header("Last-Modified", self.date_time_string(os.path.getmtime(path)))
        self.end_headers()
        return source

    def copyfile(self, source, outputfile):
        if not self.range:
            return super().copyfile(source, outputfile)
        remaining = self.range[1] - self.range[0] + 1
        while remaining:
            chunk = source.read(min(64 * 1024, remaining))
            if not chunk:
                break
            outputfile.write(chunk)
            remaining -= len(chunk)

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    print("http://localhost:%d  ·  סקיצה ב׳" % PORT)
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
