"""
Simple static file server that adds a Content-Security-Policy header including
`frame-ancestors` so browsers see it as a response header (not a meta tag).

Usage:
    python serve_with_csp.py 8000

This will serve files from the current directory on the given port.
"""
from http.server import SimpleHTTPRequestHandler, HTTPServer
import sys

class CSPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Example policy: allow self framing, disallow everything else by default
        self.send_header('Content-Security-Policy', "default-src 'self'; frame-ancestors 'self';")
        super().end_headers()

if __name__ == '__main__':
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    server_address = ('', port)
    httpd = HTTPServer(server_address, CSPRequestHandler)
    print(f"Serving on http://localhost:{port} with CSP header (frame-ancestors)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down...')
        httpd.server_close()
