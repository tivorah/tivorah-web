const bundleIdentifier = process.env.APPLE_APP_BUNDLE_IDENTIFIER || "com.tivorah.tivorah";
const teamId = process.env.APPLE_TEAM_ID?.trim();

export function GET() {
  const appId = teamId && /^[A-Z0-9]{10}$/.test(teamId) ? `${teamId}.${bundleIdentifier}` : null;
  return Response.json({
    applinks: {
      apps: [],
      details: appId ? [{
        appID: appId,
        paths: ["/u/*", "/hubs/invite*", "/events/*"],
      }] : [],
    },
  }, {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" },
  });
}
