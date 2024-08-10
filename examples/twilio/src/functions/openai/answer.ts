import { currentWorkflow, log } from "@restackio/restack-sdk-ts/function";
import { webSocketConnect } from "../../streams/connect";
import { OpenaiChat } from "./chat";
import { answerEvent, Question } from "../../workflows/twilioStream";
import Restack from "@restackio/restack-sdk-ts";

type AnswerOutput = {
  streamSid: string;
  completeResponse: string;
  interactionCount: number;
  toolsCalled: string[];
};

export async function questionAnswer({
  streamSid,
  text,
  interactionCount,
}: Question): Promise<AnswerOutput> {
  // const ws = await webSocketConnect();

  return new Promise((resolve) => {
    const openaiChat = new OpenaiChat();

    openaiChat.setCallSid({ callSid: streamSid });

    openaiChat.completion({
      text,
      interactionCount,
    });

    openaiChat.on("gptreply", async (gptReply, interactionCount) => {
      const restack = new Restack();
      const { workflowId, runId } = currentWorkflow().workflowExecution;
      restack.update({
        workflowId,
        runId,
        updateName: answerEvent.name,
        input: {
          streamSid,
          trackName: "agent",
          gptReply,
          interactionCount,
        },
      });
      log.info(`Interaction ${interactionCount}: OpenAI:`, event);
    });

    openaiChat.on(
      "end",
      async ({ completeResponse, interactionCount, toolsCalled }) => {
        resolve({
          streamSid,
          completeResponse,
          interactionCount,
          toolsCalled,
        });
      }
    );
  });
}
