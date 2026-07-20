import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, sep } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const publicRoot = join(projectRoot, "dist");
const host = process.env.PREVIEW_HOST ?? "127.0.0.1";
const port = Number.parseInt(process.env.PREVIEW_PORT ?? "4173", 10);

const contentTypes = new Map([
  [".avif", "image/avif"],
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"],
]);

async function existingFile(path) {
  try {
    return (await stat(path)).isFile() ? path : undefined;
  } catch (error) {
    if (error?.code === "ENOENT") return undefined;
    throw error;
  }
}

async function resolveRequestPath(pathname) {
  const decodedPath = decodeURIComponent(pathname);
  const safePath = normalize(decodedPath).replace(/^([/\\])+/, "");
  const candidate = join(publicRoot, safePath);

  if (candidate !== publicRoot && !candidate.startsWith(`${publicRoot}${sep}`)) {
    return undefined;
  }

  if (extname(candidate)) return existingFile(candidate);
  return existingFile(join(candidate, "index.html"));
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", `http://${host}:${port}`);
    const requestedFile = await resolveRequestPath(requestUrl.pathname);
    const file = requestedFile ?? join(publicRoot, "404.html");
    const statusCode = requestedFile ? 200 : 404;
    const extension = extname(file).toLowerCase();

    response.writeHead(statusCode, {
      "Cache-Control": "no-cache",
      "Content-Type": contentTypes.get(extension) ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    createReadStream(file).pipe(response);
  } catch (error) {
    console.error(error);
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Internal preview server error");
  }
});

server.listen(port, host, () => {
  console.log(`Production preview available at http://${host}:${port}`);
});
