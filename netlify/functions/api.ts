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

// AWS Lambda compatibility handler
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

function shouldBase64Encode(contentType: string | null): boolean {
  if (!contentType) return false;
  const [segment] = contentType.split(";");
  const normalized = segment.toLowerCase().trim();
  if (normalized.startsWith("text/")) return false;
  if (normalized.endsWith("+json") || normalized.endsWith("+xml")) return false;
  const textTypes = new Set([
    "application/csp-report",
    "application/graphql",
    "application/json",
    "application/javascript",
    "application/x-www-form-urlencoded",
    "application/x-ndjson",
    "application/xml",
  ]);
  return !textTypes.has(normalized);
}

async function buildEventFromRequest(request: Request) {
  const url = new URL(request.url);
  const queryStringParameters: Record<string, string> = {};
  const multiValueQueryStringParameters: Record<string, string[]> = {};
  url.searchParams.forEach((value, key) => {
    queryStringParameters[key] = value;
    multiValueQueryStringParameters[key] = [...(multiValueQueryStringParameters[key] ?? []), value];
  });

  const headers: Record<string, string> = {};
  const multiValueHeaders: Record<string, string[]> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
    multiValueHeaders[key.toLowerCase()] = value.split(",").map((v) => v.trim());
  });

  const contentType = request.headers.get("content-type") ?? "";
  const isBinary = shouldBase64Encode(contentType);
  let body: string | null = null;
  let isBase64Encoded = false;

  if (request.body && request.method !== "GET" && request.method !== "HEAD") {
    if (isBinary) {
      const buffer = await request.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binaryString = "";
      for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
      }
      body = btoa(binaryString);
      isBase64Encoded = true;
    } else {
      body = await request.text();
      isBase64Encoded = false;
    }
  }

  return {
    rawUrl: request.url,
    rawQuery: url.search.replace(/^\?/, ""),
    path: url.pathname,
    httpMethod: request.method,
    headers,
    multiValueHeaders,
    queryStringParameters: Object.keys(queryStringParameters).length > 0 ? queryStringParameters : null,
    multiValueQueryStringParameters: Object.keys(multiValueQueryStringParameters).length > 0 ? multiValueQueryStringParameters : null,
    body,
    isBase64Encoded,
  };
}

function buildResponseFromResult(result: any): Response {
  const headers = new Headers();
  if (result.headers) {
    for (const [name, value] of Object.entries(result.headers)) {
      headers.set(name.toLowerCase(), String(value));
    }
  }
  if (result.multiValueHeaders) {
    for (const [name, values] of Object.entries(result.multiValueHeaders)) {
      for (const value of values as string[]) {
        headers.append(name.toLowerCase(), String(value));
      }
    }
  }
  let body: any = null;
  if (result.body != null) {
    if (result.isBase64Encoded) {
      const binaryString = atob(result.body);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      body = bytes;
    } else {
      body = result.body;
    }
  }
  return new Response(body, {
    status: result.statusCode || 200,
    headers,
  });
}

// Modern Netlify Function handler (V2 API)
// The export default triggers modern V2 runtime, which automatically provisions
// and injects NETLIFY_DB_URL from Netlify Database.
export default async (request: Request, context: any): Promise<Response> => {
  try {
    const event = await buildEventFromRequest(request);
    const lambdaContext = {
      awsRequestId: context?.requestId || "",
      callbackWaitsForEmptyEventLoop: true,
      getRemainingTimeInMillis: () => 10000,
    };
    const result = await handler(event, lambdaContext);
    return buildResponseFromResult(result);
  } catch (err: any) {
    console.error("[Modern Netlify Function Error]:", err?.message || err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Serverless function execution error.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
