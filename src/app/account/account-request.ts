export async function accountRequest(
  input: RequestInfo | URL,
  init?: RequestInit,
  fetcher: typeof fetch = fetch,
) {
  try {
    return await fetcher(input, init);
  } catch (error) {
    console.error("Customer account request failed", error);
    return new Response(
      JSON.stringify({
        error: "Anslutningen till Screenia misslyckades. Kontrollera nätverket och försök igen.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
