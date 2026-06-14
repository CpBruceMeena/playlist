import type { ApiResponse, ApiError } from "@playlist/types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/playlist/api/v1";

const REQUEST_TIMEOUT_MS = 60_000; // 60 seconds

class ApiClient {
  private accessToken: string | null = null;
  private abortController: AbortController | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  /** Cancel any in-flight request (useful on page navigation) */
  cancelPending() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    // Create a new AbortController for this request (don't auto-cancel previous —
    // concurrent requests like loadSingers + generate should not interfere)
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // Timeout via race between fetch and a timer
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timerId = setTimeout(() => {
        this.abortController?.abort();
        reject(new ApiRequestError("Request timed out", "TIMEOUT", 408));
      }, REQUEST_TIMEOUT_MS);

      signal.addEventListener("abort", () => {
        clearTimeout(timerId);
      });
    });

    try {
      const response = await Promise.race([
        fetch(`${BASE_URL}${endpoint}`, {
          ...options,
          headers,
          signal,
        }),
        timeoutPromise,
      ]);

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({}))) as ApiError;
        throw new ApiRequestError(
          errorBody.error?.message ?? "An unexpected error occurred",
          errorBody.error?.code,
          response.status,
        );
      }

      const body = (await response.json()) as ApiResponse<T>;
      return body.data;
    } catch (err) {
      if (err instanceof ApiRequestError) throw err;
      if ((err as Error)?.name === "AbortError") {
        throw new ApiRequestError("Request was cancelled", "CANCELLED", 499);
      }
      throw err;
    } finally {
      this.abortController = null;
    }
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export class ApiRequestError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.status = status;
  }
}

export const apiClient = new ApiClient();
