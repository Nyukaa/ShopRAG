import { app } from "@azure/functions";
import { Resend } from "resend";

app.http("sendReviewEmail", {
  methods: ["POST"],
  authLevel: "function", // требует ?code=<function-key> в URL, либо x-functions-key заголовок
  handler: async (request, context) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      context.error("RESEND_API_KEY is not configured");
      return { status: 500, jsonBody: { error: "Server misconfigured" } };
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return { status: 400, jsonBody: { error: "Invalid JSON" } };
    }

    const { to, subject, restaurantName, message } = body ?? {};
    if (!to || !subject || !restaurantName || !message) {
      return {
        status: 400,
        jsonBody: {
          error:
            "Missing required fields: to, subject, restaurantName, message",
        },
      };
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: [to],
      subject,
      html: `<h1>New Review for ${restaurantName}</h1><p>${message}</p>`,
    });

    if (error) {
      context.error("Resend error:", error.message);
      return { status: 500, jsonBody: { error: error.message } };
    }

    return { status: 200, jsonBody: { success: true, messageId: data?.id } };
  },
});
