

## Campaigns Feature — Operational & Technical Description

This is documentation only. Below is a complete description of how Campaigns work in `marketa-agent-hub` (this Vite app), followed by a portable JSON spec another agent can use to replicate the feature in Next.js.

---

### 1. Conceptual model

Campaigns are split into three categories the UI treats distinctly:

- **Weekly Packs (`wpp`)** — recurring weekly content bundles per partner. Approval-driven, lives under the same Campaigns admin page but is a separate workflow.
- **Custom (`custom`)** — one-off coordinated campaigns (e.g. "Codex Launch Week").
- **Sequences (`sequence`)** — multi-day daily content programs. **21 Awakenings** is the canonical example: 22 items (Day 0 explainer + Days 1–21).

Two roles interact with campaigns:

- **`agqAdmin`** (`/campaigns`) — sees all three tabs, manages partner participation, can switch into the partner view of any campaign via `View Details` / `Partner View`.
- **`partnerAdmin`** (`/p/campaigns`) — sees a catalog split into **Available** vs **Joined**, can preview, join, or propose a new campaign.

---

### 2. Visual representation

**Admin (`src/pages/Campaigns.tsx`)**
- Top-level `Tabs`: Weekly Packs | Custom Campaigns | Sequences.
- Sequence card (21 Awakenings) shows: name + Play icon, status badge, duration, partner count, KNYT/day reward, a "Partner Participation" chip strip (`TIN, CMG, DFA, AGQ +N more`), and two buttons: `View Details` (admin detail) and `Partner View` (jumps into `/p/campaigns/:id`).

**Partner catalog (`src/pages/partner/PartnerCampaignCatalog.tsx`)**
- Header with `Propose Campaign` CTA → `/p/campaigns/new`.
- "What you're looking at" explainer card.
- `Tabs`: Available (count) | Joined (count).
- `CampaignCard` highlights 21 Awakenings with a sparkles icon and primary border, shows `Sequence`/`One-off` badge, duration, channel chips, and dual buttons `View Campaign` (`?preview=1`) / `Join Campaign`.

**Partner detail (`src/pages/partner/PartnerCampaignDetail.tsx`) — the heart of the experience**
1. Header: back button, sparkles + megaphone icon, name, description, type badge, Joined/Not Joined badge.
2. Welcome card (only when `is21Awakenings && !isJoined`): bullet list (22-day journey, Day 0/1 explainers, share-to-earn, KNYT/Qc rewards) plus a 3-thumbnail preview grid pulled from `sequenceItems.slice(0, 3)`.
3. Rewards card (when `marketa_partner_rewards.length > 0`).
4. `Tabs`: `Join` (pre-join) → `Sequence` / `Status` (post-join), plus `Details`.
   - **Join tab**: channel checkboxes, optional start date, approval checkbox, Join button.
   - **Sequence tab**: progress bar (current_day / total_days), Explainer Videos grid (items with `explainer === true`), then a `ScrollArea` Daily Sequence list of `SequenceDayCard`s.
   - **Status tab**: progress, joined_at, status badge, recent delivery receipts.
5. `SequenceDayCard` — left-side 128×80 thumbnail (`thumbnail_url`, fallback `/placeholder.svg`) with hover Play overlay and Explainer badge; right side `Day N`, title, description, status badge, and two buttons `View Asset` + `Watch` that open `cta_url` in a new tab while firing `asset_click` / `cta_click` events.

---

### 3. Operational flow (admin invites → partner reviews → partner joins)

1. **Admin defines the campaign** upstream in the Marketa platform DB (schema `marketa.marketa_campaigns` + `marketa_sequence_items` + `marketa_partner_rewards`). The UI does **not** create sequence items — it consumes them from the Bridge.
2. **Admin makes it discoverable** by setting `status='active'` on the platform side. The Bridge endpoint `campaign_catalog` then surfaces it in `available_campaigns`.
3. **Admin "invites" partners** implicitly: any partner whose tenant has access (gated by `x-tenant-id`/`x-persona-id` on the Bridge) sees the campaign in `/p/campaigns` under **Available**. Invitation = visibility, not a separate notification.
4. **Partner previews** via `View Campaign` → `/p/campaigns/:id?preview=1` → `PartnerCampaignDetail` renders with `isPreview=true`, unlocking the Sequence tab so the partner can browse all 22 days, watch explainers, and inspect rewards/channels — without having joined.
5. **Partner joins**: selects channels, optional start date, ticks approval → `useJoinCampaign` → `POST /api/marketa/lvb/bridge?action=join_campaign` (body: `campaignId, channels, startDate, publishingMode='automation'`). Response config flips `is_joined=true` and the Joined tab appears in the catalog.
6. **Partner consumes the sequence**: hovering / clicking each day fires `trackPartnerEvent` (`sequence_view`, `asset_click`, `cta_click`, `share_completed`) → `POST /api/engagement/track` with `eventType='marketa_partner_event'`. Status polls every 30s via `useCampaignStatus`.

---

### 4. Technical wiring (this Vite app)

- **Data path**: All UI calls go through `marketaApi` (`src/services/marketaApi.ts`), which calls `bridgeGet`/`bridgePost` against `/api/marketa/lvb/bridge`. In dev, Vite proxies to `dev-beta.aigentz.me`. In preview/prod, requests are tunneled through the Supabase Edge Function `marketa-proxy` (`supabase/functions/marketa-proxy/index.ts`) which forwards `x-tenant-id`, `x-persona-id`, `x-dev-override`.
- **Required headers (every request)**: `x-tenant-id` (default `metaproof`) and `x-persona-id` (handle like `qriptiq@knyt`, resolved server-side to a CRM UUID).
- **React Query hooks** (`src/hooks/usePartnerApi.ts`): `useCampaignCatalog`, `useCampaignDetailFull`, `useCampaignStatus` (30s refetch), `useJoinCampaign`, `useTrackEvent`, plus the composite `use21AwakeningsCampaign`.
- **Constants**: `CAMPAIGN_21_AWAKENINGS_ID = 'campaign_1768709183190_qq6f0x0sj'`.
- **Normalization**: `getCampaignDetailFull` maps the upstream shape (`campaign_type`, `marketa_sequence_items[]`, `marketa_partner_rewards[]`) to the typed `MarketaCampaignDetail`. Sequence items are sorted by `day_number` ascending in the page; explainer items are filtered by `item.explainer === true`. Thumbnails fall back to `/placeholder.svg` on error.
- **Catalog merge**: `getCampaignCatalog` merges `available_campaigns` and `joined_campaigns` keyed by `id`, marking `is_joined`.
- **Fallback data**: `getFallbackCampaignCatalog` and `getFallbackCampaignDetail` keep the UI alive if the Bridge returns nothing.

---

### 5. JSON pack to hand to another agent (Next.js replication)

This is the artifact the user requested. I'll write it to `/mnt/documents/campaigns-feature-spec.json` so they can download and forward it. It includes: contract types, endpoint contract, header rules, route map, component contract for the detail page, event taxonomy, the 21 Awakenings expected payload shape, and Next.js port notes (App Router routes, server components vs client components, where the Edge proxy maps to Next API routes).

I will also write a short companion `campaigns-feature-spec.md` summarizing the operational + visual description above for human reading.

Both files will be delivered as `<lov-artifact>` tags after I switch to default mode.

---

### Plan to execute (one shot, no UI changes)

1. Write `/mnt/documents/campaigns-feature-spec.json` containing:
   - `overview`, `roles`, `routes`, `endpoints` (with method, path, headers, request/response schemas, examples), `types` (TS-like JSON for `MarketaCampaignDetail`, `MarketaSequenceItem`, `MarketaPartnerReward`, `CampaignCatalogItem`, `PartnerEventPayload`, `PartnerJoinResponse`), `eventTaxonomy`, `21AwakeningsExample` (sample sequence item + thumbnail/cta_url shape), `uiContract` (what each tab/card renders and which fields drive it), `nextJsPortNotes` (App Router route mapping `/p/campaigns/[id]/page.tsx`, server-side header forwarding via `route.ts` handlers replacing the Supabase edge proxy, React Query setup, env vars).
2. Write `/mnt/documents/campaigns-feature-spec.md` — human-readable companion.
3. Emit two `<lov-artifact>` tags.

No source files in `/dev-server` will change.

