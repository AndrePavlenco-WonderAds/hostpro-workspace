import Image from "next/image";
import { redirect } from "next/navigation";
import { UnlockForm } from "@/components/unlock-form";
import { isGateUnlocked } from "@/lib/gate-auth";

export const metadata = {
  title: "Acesso — HostPro Workspace",
};

export default async function UnlockPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // If already unlocked, skip straight to the requested destination.
  if (await isGateUnlocked()) {
    const { next } = await searchParams;
    redirect(next && next.startsWith("/") ? next : "/");
  }

  const { next } = await searchParams;
  const target = next && next.startsWith("/") ? next : "/";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-navy-dark px-6">
      {/* Hero background photo, blurred + dimmed. */}
      <Image
        src="/hero-living-room.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover scale-110 blur-2xl opacity-35"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-navy-dark/70 via-brand-navy-dark/85 to-brand-navy-dark/95" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
        <Image
          src="/hostpro-logo-white.png"
          alt="HostPro"
          width={220}
          height={60}
          priority
        />
        <UnlockForm next={target} />
      </div>
    </div>
  );
}
