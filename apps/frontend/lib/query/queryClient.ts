import { QueryClient, isServer } from "@tanstack/react-query";
import { isClientError } from "@/lib/api/errors";

const MAX_RETRIES = 2;

function shouldRetry(failureCount: number, error: unknown) {
  if (isClientError(error)) return false;
  return failureCount < MAX_RETRIES;
}

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;


export function getQueryClient() {
  if (isServer) return makeQueryClient();

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
