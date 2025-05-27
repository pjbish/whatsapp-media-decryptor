import { QueryClient } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const errorText = await res.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: errorText };
    }
    throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
  }
}

export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  const res = await fetch(url, {
    credentials: "include",
    ...options,
  });
  
  await throwIfResNotOk(res);
  
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => (ctx: { queryKey: unknown[] }) => Promise<T | null> = ({ on401 }) => {
  return async ({ queryKey }) => {
    const [url] = queryKey;
    try {
      return await apiRequest(url as string);
    } catch (error: any) {
      if (error.status === 401 || error.message?.includes("401")) {
        if (on401 === "returnNull") {
          return null;
        }
      }
      throw error;
    }
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
