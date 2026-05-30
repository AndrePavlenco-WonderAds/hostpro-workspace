import { notFound } from "next/navigation";
import { Cormorant_Garamond } from "next/font/google";

import { getProperty } from "@/lib/properties";
import { BILLING, BANKING, TAGLINE } from "@/lib/property-billing";
import { ReservaForm } from "@/components/reserva-form";

// Serif for the big "RESERVA" / "Obrigado!" titles.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getProperty(slug);
  return { title: p ? `Reserva — ${p.name} — HostPro` : "Reserva — HostPro" };
}

export default async function ReservaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = getProperty(slug);
  if (!property) notFound();

  const billing = BILLING[property.slug];

  return (
    <div className={`min-h-screen bg-brand-navy-dark ${cormorant.variable}`}>
      <ReservaForm
        property={{
          slug: property.slug,
          name: property.name,
          shortName: property.shortName,
        }}
        billing={billing}
        banking={BANKING}
        tagline={TAGLINE}
      />
    </div>
  );
}
