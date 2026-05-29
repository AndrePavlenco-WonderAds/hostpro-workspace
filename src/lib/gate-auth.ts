import { cookies } from "next/headers";

// App-wide gate — every page is locked until the visitor enters the superadmin
// password. The password defaults to "superadmin" and is overridable via the
// `HOSTPRO_GATE_PASSWORD` env var (set in Vercel project settings).

export const GATE_COOKIE = "hostpro-gate";

export const GATE_PASSWORD =
  process.env.HOSTPRO_GATE_PASSWORD || "superadmin";

/** True when the current request carries a valid gate auth cookie. */
export async function isGateUnlocked(): Promise<boolean> {
  const store = await cookies();
  return store.get(GATE_COOKIE)?.value === GATE_PASSWORD;
}
