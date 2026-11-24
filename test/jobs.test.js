
import { test } from "node:test";
import assert from "node:assert/strict";
import { findJob, loadJobs, searchJobs } from "../lib/jobs.js";
import { createApp } from "../server.js";

test("loads the jobs file", async () => {
  const jobs = await loadJobs();
  assert.ok(jobs.length >= 8);
  assert.ok(jobs.every((j) => j.id && j.title));
});

test("search matches title, company and place, ignoring case", async () => {
  const jobs = await loadJobs();
  assert.deepEqual(searchJobs(jobs, "intern").length, jobs.length);
  assert.deepEqual(searchJobs(jobs, "REMOTE").map((j) => j.id), ["j1", "j3", "j6", "j8"]);
  assert.deepEqual(searchJobs(jobs, "kosha").map((j) => j.id), ["j4"]);
  assert.equal(searchJobs(jobs, "").length, jobs.length);
});

test("findJob returns null for an unknown id", async () => {
  const jobs = await loadJobs();
  assert.equal(findJob(jobs, "j2").company, "Kite Learning");
  assert.equal(findJob(jobs, "nope"), null);
});

test("saved jobs API supports saving, listing, duplicates and removing", async () => {
  const app = createApp();

  await new Promise((resolve) => app.listen(0, resolve));

  const address = app.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const saveResponse = await fetch(`${baseUrl}/api/saved`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: "j1" }),
    });

    assert.equal(saveResponse.status, 201);

    const duplicateResponse = await fetch(`${baseUrl}/api/saved`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: "j1" }),
    });

    assert.equal(duplicateResponse.status, 200);

    const savedResponse = await fetch(`${baseUrl}/api/saved`);
    const savedJobs = await savedResponse.json();

    assert.deepEqual(savedJobs.map((job) => job.id), ["j1"]);

    const removeResponse = await fetch(`${baseUrl}/api/saved/j1`, {
      method: "DELETE",
    });

    assert.equal(removeResponse.status, 200);

    const emptyResponse = await fetch(`${baseUrl}/api/saved`);
    assert.deepEqual(await emptyResponse.json(), []);
  } finally {
    await new Promise((resolve, reject) => {
      app.close((err) => (err ? reject(err) : resolve()));
    });
  }
});

test("saved jobs API rejects unknown job IDs", async () => {
  const app = createApp();

  await new Promise((resolve) => app.listen(0, resolve));

  const address = app.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const response = await fetch(`${baseUrl}/api/saved`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: "unknown-job" }),
    });

    assert.equal(response.status, 404);

    const result = await response.json();
    assert.ok(result.error);
  } finally {
    await new Promise((resolve, reject) => {
      app.close((err) => (err ? reject(err) : resolve()));
    });
  }
});
