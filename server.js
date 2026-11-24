
// A small job board with saved jobs stored in a JSON file.
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { loadJobs, searchJobs, findJob } from "./lib/jobs.js";

const PORT = Number(process.env.PORT ?? 3000);
const SAVED_FILE = new URL("./saved.json", import.meta.url);

function sendJson(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(body));
}

async function readSavedIds() {
  try {
    const raw = await readFile(SAVED_FILE, "utf8");
    const ids = JSON.parse(raw);
    return Array.isArray(ids) ? ids : [];
  } catch (err) {
    if (err.code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

async function writeSavedIds(ids) {
  await writeFile(SAVED_FILE, JSON.stringify(ids, null, 2));
}

async function readRequestBody(req) {
  let body = "";

  for await (const chunk of req) {
    body += chunk;
  }

  return JSON.parse(body);
}

export function createApp() {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");

      if (req.method === "GET" && url.pathname === "/api/jobs") {
        const jobs = await loadJobs();
        return sendJson(
          res,
          200,
          searchJobs(jobs, url.searchParams.get("q"))
        );
      }

      if (req.method === "GET" && url.pathname === "/api/saved") {
        const jobs = await loadJobs();
        const savedIds = await readSavedIds();
        const savedJobs = savedIds
          .map((id) => findJob(jobs, id))
          .filter(Boolean);

        return sendJson(res, 200, savedJobs);
      }

      if (req.method === "POST" && url.pathname === "/api/saved") {
        let body;

        try {
          body = await readRequestBody(req);
        } catch {
          return sendJson(res, 400, { error: "Invalid JSON body" });
        }

        const jobId = body?.jobId;

        if (typeof jobId !== "string" || !jobId.trim()) {
          return sendJson(res, 400, {
            error: "jobId is required",
          });
        }

        const jobs = await loadJobs();
        const job = findJob(jobs, jobId);

        if (!job) {
          return sendJson(res, 404, {
            error: `Job with id '${jobId}' was not found`,
          });
        }

        const savedIds = await readSavedIds();

        if (savedIds.includes(jobId)) {
          return sendJson(res, 200, {
            message: "Job is already saved",
            job,
          });
        }

        savedIds.push(jobId);
        await writeSavedIds(savedIds);

        return sendJson(res, 201, {
          message: "Job saved successfully",
          job,
        });
      }

      if (
        req.method === "DELETE" &&
        url.pathname.startsWith("/api/saved/")
      ) {
        const jobId = decodeURIComponent(
          url.pathname.slice("/api/saved/".length)
        );

        const jobs = await loadJobs();
        const job = findJob(jobs, jobId);

        if (!job) {
          return sendJson(res, 404, {
            error: `Job with id '${jobId}' was not found`,
          });
        }

        const savedIds = await readSavedIds();

        if (!savedIds.includes(jobId)) {
          return sendJson(res, 404, {
            error: "This job is not in your saved jobs",
          });
        }

        const updatedIds = savedIds.filter((id) => id !== jobId);
        await writeSavedIds(updatedIds);

        return sendJson(res, 200, {
          message: "Job removed successfully",
        });
      }

      if (
        req.method === "GET" &&
        (url.pathname === "/" || url.pathname === "/app.js")
      ) {
        const file = url.pathname === "/" ? "index.html" : "app.js";
        const type = file.endsWith(".html")
          ? "text/html"
          : "text/javascript";

        const content = await readFile(
          new URL(`./public/${file}`, import.meta.url)
        );

        res.writeHead(200, {
          "content-type": `${type}; charset=utf-8`,
        });

        return res.end(content);
      }

      return sendJson(res, 404, { error: "Not found" });
    } catch (err) {
      console.error(err);
      return sendJson(res, 500, {
        error: "Something went wrong",
      });
    }
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  createApp().listen(PORT, () => {
    console.log(`Job board on http://localhost:${PORT}`);
  });
}
