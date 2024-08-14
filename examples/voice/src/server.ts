import "dotenv/config";
import express from "express";
import { createServer } from "http";
import WebSocket, { WebSocketServer } from "ws";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import Restack from "@restackio/restack-sdk-ts";
import { streamWorkflow } from "./workflows/stream/stream";
import { StreamInfo, streamInfoEvent } from "./workflows/stream/events";
import cors from "cors";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 4000;
export const websocketAddress = `wss://${process.env.SERVER}/connection`;

app.use(cors());
app.use(express.json());

app.post("/start", async (req, res) => {
  try {
    const restack = new Restack();

    const workflowId = `${Date.now()}-${streamWorkflow.name}`;

    const workflowRunId = await restack.scheduleWorkflow({
      workflowName: streamWorkflow.name,
      workflowId,
    });

    console.log("workflowRunId", workflowRunId);

    if (workflowRunId) {
      console.log("update");
      try {
        console.log("update");
        restack.sendWorkflowEvent({
          workflowId,
          runId: workflowRunId,
          eventName: streamInfoEvent.name,
          input: { streamSid: workflowRunId },
        });
      } catch (error) {
        console.log("update error", error);
      }

      res.status(200).send({ streamSid: workflowRunId, websocketAddress });
    } else {
      console.log("error");
      throw new Error("Could not start session.");
    }
  } catch (error) {
    console.error("Error scheduling workflow:", error);
    res.status(500).send({ error: "Failed to schedule workflow" });
  }
});

app.post("/incoming", async (req, res) => {
  try {
    const workflowId = `${Date.now()}-${streamWorkflow.name}`;
    const restack = new Restack();
    const runId = await restack.scheduleWorkflow({
      workflowName: streamWorkflow.name,
      workflowId,
      input: {},
    });

    console.log(`Started workflow with runId: ${runId}`);

    if (runId) {
      const response = new VoiceResponse();
      const connect = response.connect();
      const stream = connect.stream({ url: `${websocketAddress}` });

      stream.parameter({ name: "runId", value: runId });
      stream.parameter({ name: "workflowId", value: workflowId });
      res.type("text/xml");
      res.end(response.toString());
    } else {
      throw new Error("Failed to get runId from workflow handle");
    }
  } catch (err) {
    console.log(err);
  }
});

wss.on("connection", (ws) => {
  const restack = new Restack();

  let workflowId: string;
  let runId: string;

  ws.on("error", console.error);

  ws.on("message", async function message(data, isBinary) {
    // allows broadcast to all clients except this one (otherwise echo)

    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    });

    const message = JSON.parse(data.toString());
    const streamSid = message.streamSid;

    if (message.event === "start") {
      console.log(`Twilio -> Starting Media Stream for ${streamSid}`);
      runId = message.start.customParameters.runId;
      workflowId = message.start.customParameters.workflowId;
      if (runId) {
        try {
          if (streamSid) {
            const input: StreamInfo = { streamSid };
            await restack.sendWorkflowEvent({
              workflowId,
              runId,
              eventName: streamInfoEvent.name,
              input,
            });
            console.log(
              `Signaled workflow ${workflowId} runId ${runId} with Twilio streamSid: ${streamSid}`
            );
          }
        } catch (error) {
          console.log("Error signaling workflow", error);
        }
      }
    }

    if (message.event === "stop") {
      console.log(`Twilio -> Media stream ${streamSid} ended.`);
    }
  });
});

// function shutdown() {
//   wss.close(() => {
//     server.close(() => {
//       process.exit(0);
//     });
//   });
// }

// // Listen for termination signals
// process.on("SIGTERM", shutdown);
// process.on("SIGINT", shutdown);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket address: ${websocketAddress}`);
});
