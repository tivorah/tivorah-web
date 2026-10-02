import * as yup from "yup";

export const WEB_ENV_KEYS = ["NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_SITE_URL"] as const;

const httpUrl = (name: string) => yup.string().trim().required(`${name} is required`).test(
  "http-url", `${name} must be an HTTP or HTTPS URL`, (value) => {
    try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
  },
);

const schema = yup.object({
  NEXT_PUBLIC_API_URL: httpUrl("NEXT_PUBLIC_API_URL"),
  NEXT_PUBLIC_SITE_URL: httpUrl("NEXT_PUBLIC_SITE_URL"),
});

export function webEnvErrors(env: Record<string, string | undefined>): string[] {
  try {
    schema.validateSync(env, { abortEarly: false });
    return [];
  } catch (error) {
    if (!(error instanceof yup.ValidationError)) throw error;
    return [...new Set(error.errors)];
  }
}
