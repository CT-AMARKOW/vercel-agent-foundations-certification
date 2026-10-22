/**
 * Resumes the stream for an in-flight chat workflow run by its run ID.
 *
 * Workshop docs: https://vercel-agent-foundations-certification-guide.vercel.app/docs/workflow
 */

import { createModelCallToUIChunkTransform } from "@ai-sdk/workflow";
import { createUIMessageStreamResponse } from "ai";
import { getRun } from "workflow/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const startIndexParam = searchParams.get("startIndex");
  const uiStartIndex = startIndexParam ? parseInt(startIndexParam, 10) : 0;

  const run = await getRun(id);
  const readable = run
    .getReadable({ startIndex: 0 })
    .pipeThrough(createModelCallToUIChunkTransform({ uiStartIndex }));

  return createUIMessageStreamResponse({ stream: readable });
}
