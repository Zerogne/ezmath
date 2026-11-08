/** Never send these to the error tracker: secrets, and exam answers (they reveal the key). */
export const SCRUB_FIELDS = ["password", "access_token", "refresh_token", "accessToken", "token", "authorization", "cookie", "secret", "apiKey", "answers", "writtenAnswers", "responses", "selectedChoiceId", "is_correct", "accepted_answers", "phone", "code"];

/**
 * Rollbar tokens. The Vercel Marketplace integration names them per project (with a numeric suffix);
 * the plain names are a fallback for local runs. NEXT_PUBLIC_ values must be read literally to be inlined.
 */
export const rollbarServerToken = () => process.env.ROLLBAR_EZMATH_SERVER_TOKEN_1794145568 || process.env.ROLLBAR_SERVER_TOKEN;
export const rollbarClientToken = () => process.env.NEXT_PUBLIC_ROLLBAR_EZMATH_CLIENT_TOKEN_1794145568 || process.env.NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN;

export const monitoringEnvironment = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV || process.env.NODE_ENV || "development";
