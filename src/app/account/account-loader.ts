import type { AccountData } from "./account-types";

export async function fetchAccountData(
  fetcher: typeof fetch = fetch,
): Promise<{ unauthorized: true } | { unauthorized: false; data: AccountData }> {
  const response = await fetcher("/api/account");

  if (response.status === 401) {
    return { unauthorized: true };
  }
  if (!response.ok) {
    throw new Error(`Account request failed with status ${response.status}`);
  }

  return {
    unauthorized: false,
    data: (await response.json()) as AccountData,
  };
}
