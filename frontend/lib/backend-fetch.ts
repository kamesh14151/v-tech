/**
 * Robust backend fetch helper.
 * Automatically tries candidate backend URLs (configured AGENT_BACKEND_URL, http://backend:8000, http://localhost:8000)
 * to ensure seamless communication whether running inside Docker container or locally.
 */
export async function backendFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const envUrl = process.env.AGENT_BACKEND_URL;
  const candidates: string[] = [];
  if (envUrl) candidates.push(envUrl);
  candidates.push("https://v-tech-1.onrender.com");
  candidates.push("http://localhost:8000");
  candidates.push("http://127.0.0.1:8000");
  candidates.push("http://backend:8000");

  const uniqueUrls = Array.from(new Set(candidates));
  let lastError: any = null;

  for (const baseUrl of uniqueUrls) {
    try {
      const targetUrl = `${baseUrl.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
      const res = await fetch(targetUrl, options);
      return res;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("All backend URLs unreachable");
}
