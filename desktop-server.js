const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = process.pkg ? path.dirname(process.execPath) : __dirname;
const PORT = Number(process.env.PORT || 8765);
const HOST = "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".glb": "model/gltf-binary",
  ".ico": "image/x-icon"
};

function safeFile(urlPath) {
  let p = decodeURIComponent((urlPath || "/").split("?")[0]);
  if (p === "/") p = "/index.html";
  const full = path.resolve(ROOT, "." + p);
  if (full !== ROOT && !full.startsWith(ROOT + path.sep)) return null;
  return full;
}

const server = http.createServer((req, res) => {
  const pathname = (req.url || "/").split("?")[0];

  if (pathname === "/health" || pathname === "/api/health") {
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });
    return res.end(JSON.stringify({ ok: true, port: PORT }));
  }

  const file = safeFile(req.url);
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Not found");
  }

  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Cache-Control": ext === ".html" ? "no-store" : "public,max-age=3600"
  });

  fs.createReadStream(file)
    .on("error", () => {
      if (!res.headersSent) res.writeHead(500);
      res.end("Server error");
    })
    .pipe(res);
});

function openChrome(url) {
  try {
    spawn("cmd.exe", ["/c", "start", "", url], {
      detached: true,
      stdio: "ignore",
      windowsHide: true
    }).unref();
  } catch (_) {}
}

server.on("error", (err) => {
  console.error("The Rake server failed:", err.message);
  process.exitCode = 1;
});

server.listen(PORT, HOST, () => {
  const url = "http://" + HOST + ":" + PORT + "/index.html";
  console.log("The Rake server is running at " + url);
  openChrome(url);
});
