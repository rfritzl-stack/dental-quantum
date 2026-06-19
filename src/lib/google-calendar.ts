/**
 * Utility to sync appointments with Google Calendar.
 * Fallbacks to console logging in development if Google credentials are missing.
 */
export async function createGoogleCalendarEvent({
  summary,
  description,
  startDateTime,
  endDateTime,
  organizerEmail,
}: {
  summary: string;
  description: string;
  startDateTime: Date;
  endDateTime: Date;
  organizerEmail: string;
}) {
  const isConfigured = !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );

  if (!isConfigured) {
    console.log("=========================================");
    console.log(`[Google Calendar Simulation]`);
    console.log(`Calendar:    ${organizerEmail}`);
    console.log(`Event:       ${summary}`);
    console.log(`Description: ${description}`);
    console.log(`Start:       ${startDateTime.toISOString()}`);
    console.log(`End:         ${endDateTime.toISOString()}`);
    console.log("=========================================");
    return {
      eventId: `google_sim_${Math.random().toString(36).substr(2, 9)}`,
      success: true,
    };
  }

  try {
    // 1. Get access token from refresh token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to refresh Google OAuth token");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Insert event to Google Calendar
    const calendarId = encodeURIComponent(organizerEmail);
    const eventResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary,
          description,
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: "America/Santiago",
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: "America/Santiago",
          },
        }),
      }
    );

    if (!eventResponse.ok) {
      const errorData = await eventResponse.json();
      throw new Error(errorData.error?.message || "Failed to create Google Calendar event");
    }

    const eventData = await eventResponse.json();
    return { eventId: eventData.id, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating Google Calendar event:", error);
    return { error: message, success: false };
  }
}

/**
 * Utility to delete an appointment from Google Calendar.
 */
export async function deleteGoogleCalendarEvent({
  eventId,
  organizerEmail,
}: {
  eventId: string;
  organizerEmail: string;
}) {
  const isConfigured = !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );

  if (!isConfigured) {
    console.log("=========================================");
    console.log(`[Google Calendar Delete Simulation]`);
    console.log(`Calendar: ${organizerEmail}`);
    console.log(`Event ID: ${eventId}`);
    console.log("=========================================");
    return { success: true };
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to refresh Google OAuth token");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const calendarId = encodeURIComponent(organizerEmail);
    const deleteResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!deleteResponse.ok && deleteResponse.status !== 410) {
      // 410 means already deleted
      throw new Error("Failed to delete Google Calendar event");
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error deleting Google Calendar event:", error);
    return { error: message, success: false };
  }
}
