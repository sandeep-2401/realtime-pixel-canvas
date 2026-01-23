export const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  throw new Error("VITE_API_URL is not defined")
}

export const WS_BASE_URL = API_URL.startsWith("https")
  ? API_URL.replace("https", "wss")
  : API_URL.replace("http", "ws")
