import serverless from "serverless-http";
import { createApp } from "../../server/app.js";

let serverlessHandler: any = null;

function getHandler() {
  if (!serverlessHandler) {
    const app = createApp();
    serverlessHandler = serverless(app);
  }
  return serverlessHandler;
}

// Netlify serverless function handler
export const handler = async (event: any, context: any) => {
  try {
    const fn = getHandler();
    return await fn(event, context);
  } catch (err: any) {
    console.error("[Netlify Function Error]:", err?.message || err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: "Serverless function initialization or execution error.",
      }),
    };
  }
};
