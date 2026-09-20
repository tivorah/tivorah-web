const packageName = process.env.ANDROID_APP_PACKAGE_NAME || "com.tivorah.tivorah";

export function GET() {
  const fingerprints = (process.env.ANDROID_APP_SHA256_CERT_FINGERPRINTS || "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(value));

  return Response.json(fingerprints.length ? [{
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: packageName,
      sha256_cert_fingerprints: fingerprints,
    },
  }] : [], {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" },
  });
}
