import { redirect } from "next/navigation";

export default async function SignupRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  if (typeof sp.ref === "string") q.set("ref", sp.ref);
  if (typeof sp.next === "string") q.set("next", sp.next);
  const s = q.toString();
  redirect(s ? `/auth/signin?${s}` : "/auth/signin");
}
