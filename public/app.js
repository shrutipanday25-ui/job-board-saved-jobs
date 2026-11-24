
const list = document.getElementById("jobs");
const search = document.getElementById("search");
const savedList = document.getElementById("saved-jobs");
const message = document.getElementById("message");

function showMessage(text) {
  message.textContent = text;
}

async function showSavedJobs() {
  const res = await fetch("/api/saved");
  const jobs = await res.json();

  savedList.innerHTML = "";

  for (const job of jobs) {
    const li = document.createElement("li");
    li.textContent = `${job.title} at ${job.company}, ${job.location}. `;

    const button = document.createElement("button");
    button.textContent = "Remove";

    button.addEventListener("click", async () => {
      const response = await fetch(
        `/api/saved/${encodeURIComponent(job.id)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        showMessage(result.error);
        return;
      }

      showMessage("Job removed successfully.");
      await showSavedJobs();
      await show(search.value);
    });

    li.append(button);
    savedList.append(li);
  }
}

async function show(query = "") {
  const res = await fetch(`/api/jobs?q=${encodeURIComponent(query)}`);
  const jobs = await res.json();

  list.innerHTML = "";

  for (const job of jobs) {
    const li = document.createElement("li");

    li.textContent = `${job.title} at ${job.company}, ${job.location}. Rs ${job.stipend.toLocaleString("en-IN")} a month. `;

    const button = document.createElement("button");
    button.textContent = "Save";

    button.addEventListener("click", async () => {
      const response = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });

      const result = await response.json();

      showMessage(result.message || result.error);

      if (response.ok) {
        await showSavedJobs();
      }
    });

    li.append(button);
    list.append(li);
  }
}

search.addEventListener("input", () => show(search.value));

show();
showSavedJobs();
