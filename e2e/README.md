# E2E Testing via Protractor
Angular, by default, comes with support for e2e testing, using the tool protractor.  Protractor is a wrapper
around selenium that knows how to interact with angular applications properly.

The goal for an end-to-end test, as the name implies, is to provide tests that are fully implemented, without 
mocking any of the flow.  For angular apps, this mainly applies to the UI itself, but for these tests
we have also established a docker setup that will provide a backend, and elasticsearch search service, as well
as default data, and a matching dashboard config.

The primary goal here, is to have a self-contained test framework that can be integrated into a CI/CD pipeline
and provide feedback during the development process.

The test outputs in the standard mocha output format, and should be consumable in Jenkins to provided detailed
information on what tests fail, and why.

## Docker
The docker setup utilizes docker-compose to pull up the four primary docker containers:
* nginx - For hosting the frontend, and proxying to the backend.
* neon-server - For serving the backend (the container must be built from the neon-server codebase)
* elasticsearch - Provides elasticsearch 6.7
* nodejs - Runs the data load scripts, using the `elasticdump` tool

Additionally, all logs from the docker process are stored in the `e2e/docker/run.logs` if you need to access any of the 
output.

If you want to kill the process in mid-stream, please hit ctrl-c once, and let the script shutdown gracefully, cleaning up after itself.  Force killing (SIGKILL/SIGTERM) will force immediate shutdown of the script and prevent any cleanup operations.

### Ports
All exposed ports should generally be one less than the standard port number, to prevent any collision with local
development.

The elasticsearch host exposes itself on port `9199` for the startup script to be able to detect if data is loaded or not.
The ui server is running on `4199`, and can be accessed while the test is running.

## Running
Execution of the tests is not as simple as `npx protractor` for a few reasons, but the primary being the docker support.  To that end, 
there is a script at the base of project called `e2e.sh` which will take care of all of the orchestration work, run the tests for you.

The script itself, takes in an optional mode parameter, which supports the following values:
  * ::empty:: - Default, runs tests against a prod build of the application (for speed), browser will run in headless mode
  * debug - Will run the tests in debug mode, with sourcemaps, and will run the browser in a visible state.  The tests will wait by default on start, and you will need to open your browser to `chrome://inspect/devices` and select the NodeJS device to start the interactive testing process.
  * watch - Will run the tests in watch mode, headless, and prod-build, but will watch for changes and re-run tests on demand.  The docker state
  will not be reset, so any tests that modify the database state (should be none) will not be repeatable.

## Writing Tests
Tests themselves are organized around spec files.  Like unit tests, the tests should be clear and direct, but unlike unit tests, the tests should test the system the way a user would experience it.  Treat the system like a black box, and interact with the elements as needed. Protractor provides multiple means of ['locating'](https://www.protractortest.org/#/api?view=ProtractorBy) elements on the page (as well as being able to ['wait until'](https://www.protractortest.org/#/api?view=ProtractorExpectedConditions) an element is present/clickable/editable/etc.).  

For every spec file, there is an accompanying page object file (`.po.ts`).  This is meant to be a supporting element that provides needed state/functionality for testing.  For example, the `app.po.ts` include the ability to find a visualization by title or by tag name to be able to
directly test specific components.  

Additionally there is code that process certain visual patterns within the application to mimic how a human would understand interact.  Many of these patterns would be better suited by more semantic structure in the html document, but the visual patterns are useful as well (if not as reliable).  As an example of this, look at the `getVizPageInfo` method, which interprets the counts/paging information by processing the text directly.