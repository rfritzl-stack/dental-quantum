/**
 * Utility to send transactional emails using Resend.
 * Fallbacks to console logging in development if RESEND_API_KEY is not defined.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("=========================================");
    console.log(`[Resend Email Simulation]`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${text || "HTML Content (see below)"}`);
    console.log("-----------------------------------------");
    console.log(html);
    console.log("=========================================");
    return { id: `sim_${Math.random().toString(36).substr(2, 9)}`, success: true };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Clínica Dental Quantum <citas@dentalquantum.cl>",
        to: [to],
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to send email");
    }

    const data = await response.json();
    return { id: data.id, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending email via Resend:", error);
    return { error: message, success: false };
  }
}
