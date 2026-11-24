
# Job Board

A small job board built for an insiderOne work sample. The jobs and companies are fictional.

## Run it

You need Node.js 20 or newer. No packages need to be installed.

```bash
npm start
```

Open http://localhost:3000 in your browser.

Run the tests:

```bash
npm test
```

## What I built

I added a Saved Jobs feature to the job board.

- Users can save jobs using the Save button.
- Users can view all saved jobs in the Saved Jobs section.
- Users can remove saved jobs.
- Duplicate saved jobs are prevented.
- Saved jobs are stored in a JSON file and remain available after a page reload.
- The API returns a clear error when an unknown job ID is submitted.

## API endpoints

- `GET /api/jobs?q=` - Lists and searches jobs.
- `POST /api/saved` - Saves a job using its job ID.
- `GET /api/saved` - Returns all saved jobs.
- `DELETE /api/saved/:jobId` - Removes a saved job.

## Project structure

- `server.js` - HTTP server and API routes.
- `lib/jobs.js` - Functions for reading, searching and finding jobs.
- `jobs.json` - Job data.
- `saved.json` - Saved job IDs, created automatically.
- `public/` - Frontend HTML and JavaScript.
- `test/` - Automated tests using Node's built-in test runner.

## One design decision

I used a JSON file to store saved job IDs instead of a database. The work sample allows file-based persistence, so this keeps the application simple and avoids extra dependencies.

## Tests

The automated tests cover:

- Loading and searching jobs.
- Finding jobs by ID.
- Saving and listing jobs.
- Preventing duplicate saved jobs.
- Removing saved jobs.
- Handling unknown job IDs.

## What I would improve next

- Add better success and error messages.
- Improve the visual design and accessibility.
- Add more tests for invalid request bodies and persistence after restarting the server.

## AI assistance

I used ChatGPT to help implement the saved jobs API, frontend interactions, automated tests and README. I reviewed the changes and ran the tests locally.
