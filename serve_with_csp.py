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
        # Security headers recommended for static sites (do not break UI):
        # - Content-Security-Policy: restricts resource loading
        # - X-Frame-Options: prevent clickjacking
        # - X-Content-Type-Options: disable MIME sniffing
        # - Referrer-Policy: limit referrer leakage
        # - Permissions-Policy: disable dangerous powerful features
        # - Strict-Transport-Security (HSTS): instruct browsers to use HTTPS (only effective over HTTPS)
        csp = "default-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self';"
        self.send_header('Content-Security-Policy', csp)
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('Permissions-Policy', "geolocation=(), microphone=(), camera=(), interest-cohort=()")
        # HSTS - has no effect over plain HTTP but is safe to include if you switch to HTTPS in production
        self.send_header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
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
