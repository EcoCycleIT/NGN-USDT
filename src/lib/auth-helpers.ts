import { createClient as createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { devFallbackEnabled, getDevProfile, isMissingSchemaError } from "@/lib/dev-fallback-store";

export async function getSessionUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return data;
}

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb.from("profiles").select("role").eq("id", userId).single();
    if (error && devFallbackEnabled() && isMissingSchemaError(error)) {
      return getDevProfile(userId).role === "admin";
    }
    return data?.role === "admin";
  } catch {
    if (devFallbackEnabled()) return getDevProfile(userId).role === "admin";
    return false;
  }
}
