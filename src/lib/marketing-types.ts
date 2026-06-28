// Marketing — banco de ideias de conteúdo (Postagem de conteúdo).
// Cada ideia é uma referência que vimos noutro criador (link, TikTok, vídeo
// ou imagem) e que queremos recriar mais tarde para a HostPro.

export type ContentIdeaKind = "link" | "tiktok" | "video" | "imagem";

export const CONTENT_IDEA_KINDS: ContentIdeaKind[] = [
  "tiktok",
  "video",
  "link",
  "imagem",
];

/** Label PT + emoji para cada tipo — usado no form e nos cartões. */
export const KIND_META: Record<
  ContentIdeaKind,
  { label: string; emoji: string }
> = {
  tiktok: { label: "TikTok", emoji: "🎵" },
  video: { label: "Vídeo", emoji: "🎬" },
  link: { label: "Link", emoji: "🔗" },
  imagem: { label: "Imagem", emoji: "🖼️" },
};

export interface ContentIdea {
  id: string;
  kind: ContentIdeaKind;
  /** Nota / descrição da ideia — o que gostámos e queremos recriar. */
  title: string;
  /** Link original (TikTok, YouTube, Instagram, etc.). Opcional. */
  url?: string;
  /** Imagem carregada (URL no Vercel Blob). Opcional. */
  imageUrl?: string;
  /** ISO YYYY-MM-DD em que foi adicionada. */
  createdAt: string;
  /** Já recriámos esta ideia. */
  recreated: boolean;
}
