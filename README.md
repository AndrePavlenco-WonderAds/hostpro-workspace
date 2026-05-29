# HostPro Workspace

Workspace interno da **HostPro** — gestão de alojamentos locais na **Costa do Estoril**
(Cascais, Monte Estoril, Estoril, São João do Estoril).

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Vercel** (Hobby plan, auto-deploy from `main`)

## Setup local

```bash
npm install
npm run dev
```

Abre http://localhost:3000.

## Estrutura

```
src/app/         App Router (layout, page, globals.css)
public/          Branding (favicon, logos)
```

## Branding

Paleta exposta como Tailwind tokens:

| Token              | Hex       |
| ------------------ | --------- |
| `brand-navy`       | `#203247` |
| `brand-navy-dark`  | `#142030` |
| `brand-cyan`       | `#00B5E2` |
| `brand-cream`      | `#F2F2EB` |
| `brand-ink`        | `#0F0F0F` |

Tipografia oficial: **Gotham** (assets em `~/Desktop/HOSTPRO/Branding/HostPro Branding Font`).

## Deploy

`main` → produção via Vercel.

```bash
vercel --prod    # deploy manual
```
