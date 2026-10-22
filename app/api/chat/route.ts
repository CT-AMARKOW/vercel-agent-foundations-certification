/**
 * Chat API route. Starts a durable `chatFlow` workflow run and streams it
 * back to `WorkflowChatTransport` in `components/agent-chat.tsx`. The run ID
 * goes out in the `x-workflow-run-id` header so the client can resume.
 *
 * Workshop docs: https://vercel-agent-foundations-certification-guide.vercel.app/docs/workflow
 */

import { chatFlow } from "@/lib/workflows/chat-flow";
import { createModelCallToUIChunkTransform } from "@ai-sdk/workflow";
import type { UIMessage } from "ai";
import { createUIMessageStreamResponse } from "ai";
import { start } from "workflow/api";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const run = await start(chatFlow, [messages]);
  return createUIMessageStreamResponse({
    stream: run.readable.pipeThrough(createModelCallToUIChunkTransform()),
    headers: {
      "x-workflow-run-id": run.runId,
    },
  });
}
