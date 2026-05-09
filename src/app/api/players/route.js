export async function GET() {
  const cookie = process.env.OPEN_LEAGUE_COOKIE;

  if (!cookie) {
    return Response.json(
      { error: "OPEN_LEAGUE_COOKIE environment variable is not set." },
      { status: 500 }
    );
  }

  try {
    const resp = await fetch("https://prod.api.theopenleague.com/league/players", {
      headers: {
        Cookie: cookie.startsWith("connect.sid=") ? cookie : `connect.sid=${cookie}`,
        "User-Agent": "Mozilla/5.0",
      },
      cache: "no-store",
    });

    if (!resp.ok) {
      return Response.json(
        { error: `Open League API returned ${resp.status}. Your cookie may have expired.` },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
