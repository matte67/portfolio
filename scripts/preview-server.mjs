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
  [".mp4", "video/mp4"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"],
]);

/** Resolves one byte range for media seeks, including open-ended and suffix requests. */
function resolveVideoRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(header);
  if (!match || (!match[1] && !match[2]) || size === 0) return null;

  const [, first, last] = match;
  const start = first ? Number(first) : Math.max(size - Number(last), 0);
  const end = first && last ? Math.min(Number(last), size - 1) : size - 1;
  return start <= end ? { start, end } : null;
}

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

function legacyRedirect(pathname) {
  if (pathname === "/") return "/en/";

  const match = pathname.match(/^\/(work|articles|thesis|about)(?:\/(.*))?\/?$/);
  if (!match) return undefined;

  const [, section, remainder] = match;
  return `/en/${section}${remainder ? `/${remainder}` : "/"}`;
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", `http://${host}:${port}`);
    const redirectLocation = legacyRedirect(requestUrl.pathname);
    if (redirectLocation) {
      response.writeHead(301, { Location: `${redirectLocation}${requestUrl.search}` });
      response.end();
      return;
    }
    const requestedFile = await resolveRequestPath(requestUrl.pathname);
    const file = requestedFile ?? join(publicRoot, "404.html");
    const statusCode = requestedFile ? 200 : 404;
    const extension = extname(file).toLowerCase();

    const headers = {
      "Cache-Control": "no-cache",
      "Content-Type": contentTypes.get(extension) ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    };

    let range;
    if (statusCode === 200 && extension === ".mp4") {
      const { size } = await stat(file);
      headers["Accept-Ranges"] = "bytes";
      headers["Content-Length"] = size;

      if (request.method === "GET" && request.headers.range) {
        range = resolveVideoRange(request.headers.range, size);
        if (!range) {
          response.writeHead(416, { ...headers, "Content-Length": 0, "Content-Range": `bytes */${size}` });
          response.end();
          return;
        }

        headers["Content-Range"] = `bytes ${range.start}-${range.end}/${size}`;
        headers["Content-Length"] = range.end - range.start + 1;
      }
    }

    response.writeHead(range ? 206 : statusCode, headers);
    if (request.method === "HEAD") {
      response.end();
      return;
    }

    const stream = createReadStream(file, range);
    response.on("close", () => stream.destroy());
    stream.on("error", () => response.destroy());
    stream.pipe(response);
  } catch (error) {
    console.error(error);
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Internal preview server error");
  }
});

server.listen(port, host, () => {
  console.log(`Production preview available at http://${host}:${port}`);
});
