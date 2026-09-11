import serverless from "serverless-http";
import { createApp } from "../../server/app.js";

const app = createApp();

// Netlify serverless function handler
export const handler = serverless(app);
