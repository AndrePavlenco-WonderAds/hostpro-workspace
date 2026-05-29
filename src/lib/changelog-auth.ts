import { cookies } from "next/headers";

// The /changelog page is gated behind the same superadmin password as the rest
// of the app, but uses its own cookie so the two can evolve independently
// (e.g. shorter changelog session vs. longer app session).

export const CHANGELOG_COOKIE = "hostpro-changelog";

export const CHANGELOG_PASSWORD =
  process.env.HOSTPRO_GATE_PASSWORD || "superadmin";

/** True when the current request carries a valid changelog auth cookie. */
export async function isChangelogUnlocked(): Promise<boolean> {
  const store = await cookies();
  return store.get(CHANGELOG_COOKIE)?.value === CHANGELOG_PASSWORD;
}
