// Minimal static file server for the `out/` export (used by `npm start` and Playwright).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? "out");
const port = Number(process.argv[3] ?? 3000);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0] ?? "/");
  const candidate = path.normalize(path.join(root, clean));
  if (!candidate.startsWith(root)) return null;
  const options = [candidate, path.join(candidate, "index.html"), `${candidate}.html`];
  return options.find((p) => fs.existsSync(p) && fs.statSync(p).isFile()) ?? null;
}

http
  .createServer((req, res) => {
    const file = resolveFile(req.url ?? "/");
    if (!file) {
      const notFound = path.join(root, "404.html");
      res.writeHead(404, { "Content-Type": TYPES[".html"] });
      res.end(fs.existsSync(notFound) ? fs.readFileSync(notFound) : "Not found");
      return;
    }
    const type = TYPES[path.extname(file)] ?? "application/octet-stream";
    const cache = file.includes(`${path.sep}_next${path.sep}static`) ? "public, max-age=31536000, immutable" : "no-cache";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": cache });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => console.log(`Serving ${root} at http://localhost:${port}`));
