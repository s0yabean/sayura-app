// Base URL of the server that hosts the Expo Router API routes (app/**/+api.ts).
// In local dev this is the Metro server (e.g. http://192.168.x.x:8081); in production,
// wherever you deploy the server output of `expo export --platform web` (EAS Hosting etc).
// Only the origin is public. All provider keys stay on the server.
const BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

export const apiUrl = (path: string) => `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
