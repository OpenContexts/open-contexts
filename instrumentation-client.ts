// Runs in the browser before the site becomes interactive (see Next.js' instrumentation-client).
import { initBotId } from "botid/client/core";

// Vercel BotID for the forms that sign in, sign up and ask for a password reset by email: it adds an invisible
// check to these requests, which the captcha plugin verifies on the server (lib/auth/index.tsx). Nothing loads
// until one of them is sent, and in development it does nothing.
initBotId({
  protect: [
    { path: "/api/auth/sign-in/email", method: "POST" },
    { path: "/api/auth/sign-up/email", method: "POST" },
    { path: "/api/auth/request-password-reset", method: "POST" },
  ],
});
