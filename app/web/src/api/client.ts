import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export interface ApiErrorShape {
  message: string | string[];
  statusCode: number;
}

export function apiErrorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorShape | undefined;
    if (data?.message) return Array.isArray(data.message) ? data.message.join(" ") : data.message;
  }
  return fallback;
}
