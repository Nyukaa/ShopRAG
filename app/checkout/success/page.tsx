import SuccessClient from "./SuccessClient";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  return (
    <main className="flex-1 p-8 text-center">
      <h1 className="text-3xl font-light text-[#2C2416] mb-2">Thanks for your order!</h1>
      <p className="text-xs text-[#8C7E6E]">Session: {session_id ?? "(none)"}</p>
      <SuccessClient />
    </main>
  );
}
