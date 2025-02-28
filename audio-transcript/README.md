# Overview

This example showcases how transcribe an audio file and then translate text to a target language. You can use any mp3 file you have at your disposal to test the example. Update the filePath value at `scheduleWorkflow.ts`. A test.mp3 file is already provided and will be one used if you execute scheduleWorkflow.ts

# Requirements

- Node 20 or higher

```bash
brew install nvm
nvm use 20
```

# Install Restack Web UI

To install the Restack Web UI, you can use Docker.

```bash
docker run -d --pull always --name restack -p 5233:5233 -p 6233:6233 -p 7233:7233 ghcr.io/restackio/restack:main
```

# Start services

Where all your code is defined, including workflow steps.

add OPENAI_API_KEY in .env

```bash
npm i
npm run dev
```

Your code will be running and syncing with Restack engine to execute workflows or functions.

# Schedule workflow to send email

In another shell:

```bash
npm run schedule
```

Will schedule to start example workflow immediately. The code for this is on `scheduleWorkflow.ts`. In here you can see how the transcribeAndTranslateWorkflow is scheduled to be executed.
