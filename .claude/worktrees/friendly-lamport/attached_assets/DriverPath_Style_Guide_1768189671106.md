# DriverPath Style Guide
**Company:** Health Drivers Institute (HDI)  
**Product:** DriverPath (clinician-facing content delivery)

This guide defines the visual system, UI components, and writing standards so you can implement a consistent, scalable MVP in Replit.

---

## 1) Brand foundations

### 1.1 Purpose
Deliver evidence-informed, mechanism-first education and tools to patients with minimal clinician workflow friction.

### 1.2 Brand attributes
- **Clinical-grade:** precise, credible, not trendy
- **Efficient:** built for speed and scannability
- **Calm:** reduces cognitive load
- **Decisive:** helps clinicians choose a next step

### 1.3 Brand voice (UX writing)
- Short sentences. Strong verbs.
- Use clinician language. Avoid marketing hype.
- Prefer “guidance,” “pathway,” “handout,” “education,” “next step.”
- Avoid: “life-changing,” “revolutionary,” “game-changer,” “supercharge.”

---

## 2) Design tokens (single source of truth)

### 2.1 Core color palette (Light mode)
| Token | Hex | Use |
|---|---:|---|
| `--brand-primary` | `#0F766E` | primary actions, links, active states |
| `--brand-primary-dark` | `#115E59` | hover/pressed for primary |
| `--brand-accent` | `#F59E0B` | sparing highlight, emphasis, badges |
| `--bg` | `#F8FAFC` | app background |
| `--surface` | `#FFFFFF` | cards, panels |
| `--text` | `#0F172A` | primary text |
| `--muted` | `#475569` | secondary text |
| `--border` | `#E2E8F0` | borders, dividers |
| `--success` | `#16A34A` | success states |
| `--warning` | `#D97706` | warning states |
| `--error` | `#DC2626` | error states |
| `--info` | `#2563EB` | informational states |

### 2.2 Dark mode palette
| Token | Hex | Use |
|---|---:|---|
| `--bg` | `#0B1220` | background |
| `--surface` | `#0F1B2D` | cards |
| `--text` | `#E5E7EB` | primary text |
| `--muted` | `#94A3B8` | secondary text |
| `--border` | `#1F2A44` | borders |
| `--brand-primary` | `#14B8A6` | primary actions |
| `--brand-primary-dark` | `#0D9488` | hover/pressed |

### 2.3 CSS variables (paste into global CSS)
```css
:root{
  --brand-primary:#0F766E;
  --brand-primary-dark:#115E59;
  --brand-accent:#F59E0B;

  --bg:#F8FAFC;
  --surface:#FFFFFF;
  --text:#0F172A;
  --muted:#475569;
  --border:#E2E8F0;

  --success:#16A34A;
  --warning:#D97706;
  --error:#DC2626;
  --info:#2563EB;

  --radius:12px;
  --radius-sm:10px;

  --shadow-sm: 0 1px 2px rgba(2,6,23,.06);
  --shadow-md: 0 8px 24px rgba(2,6,23,.10);

  --ring: 0 0 0 3px rgba(20,184,166,.25); /* focus ring */
}

[data-theme="dark"]{
  --bg:#0B1220;
  --surface:#0F1B2D;
  --text:#E5E7EB;
  --muted:#94A3B8;
  --border:#1F2A44;

  --brand-primary:#14B8A6;
  --brand-primary-dark:#0D9488;

  --shadow-sm: 0 1px 2px rgba(0,0,0,.25);
  --shadow-md: 0 12px 30px rgba(0,0,0,.35);

  --ring: 0 0 0 3px rgba(20,184,166,.30);
}
```

---

## 3) Typography

### 3.1 Font stack
- Primary: **Inter**
- Fallback: `system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`

### 3.2 Type scale
| Style | Size | Weight | Line height | Use |
|---|---:|---:|---:|---|
| Display | 28px | 700 | 36px | page titles (rare) |
| H1 | 22px | 600 | 30px | main page header |
| H2 | 18px | 600 | 26px | section headers |
| Body | 14–15px | 400 | 22px | default content |
| Small | 12px | 400 | 18px | helper text, metadata |
| Label | 12–13px | 500 | 18px | form labels, badges |

### 3.3 Typography rules
- Never center-align body copy.
- Use sentence case for UI labels.
- Limit paragraph width to ~70–80 characters for readability.

---

## 4) Layout, spacing, and grid

### 4.1 Spacing scale (8px base)
Use a consistent scale:
- 4, 8, 12, 16, 20, 24, 32, 40, 48, 64

### 4.2 App shell
- Left sidebar: 240px (collapsed 72px)
- Top bar: 56px
- Content max width: 1200–1280px
- Page padding: 24px desktop, 16px mobile

### 4.3 Cards and panels
- Radius: 12px
- Border: 1px solid `--border`
- Shadow: use `--shadow-sm` for default cards; `--shadow-md` for elevated overlays

---

## 5) Components (specs + behavior)

### 5.1 Buttons
**Sizes**
- Small: 32px height, 12px/14px text
- Default: 40px height, 14px/15px text
- Large: 48px height, 15px text

**Variants**
1) **Primary**
- Background: `--brand-primary`
- Hover: `--brand-primary-dark`
- Text: white
- Use: primary action per screen (max one)

2) **Secondary**
- Background: transparent
- Border: `--border`
- Text: `--text`
- Hover: subtle surface tint

3) **Tertiary / Ghost**
- No border, transparent
- Text: `--brand-primary`
- Use: inline actions

4) **Destructive**
- Background: `--error`
- Use: delete/remove actions

**Rules**
- One primary action per view.
- Align primary action to the right in headers and modals.

### 5.2 Inputs
**Text input**
- Height: 40px
- Border: `--border`
- Focus: apply `--ring` + border tint toward primary
- Placeholder color: `--muted` at ~70% opacity

**Search input**
- Add leading icon
- Support typeahead later, but MVP can be simple

**Validation**
- Error text: 12px, `--error`
- Error border: `--error` (avoid thick borders)

### 5.3 Cards (content tiles)
**Library tile**
- Title (H2 or strong Body)
- Metadata line: “Patient • 1-page handout • 3 min”
- Tag row (chips)
- Primary action: “Send to patient”

### 5.4 Badges / chips
- Height: 24px
- Radius: 999px (pill)
- Background: muted tint (light) / subtle surface (dark)
- Text: 12px, medium
- Use for tags: Intent, Mechanism lens, Format, Audience

### 5.5 Alerts (inline)
- Info: `--info`
- Success: `--success`
- Warning: `--warning`
- Error: `--error`
Keep copy short: 1–2 lines. Provide one clear action when needed.

### 5.6 Tables (admin + reporting)
- Header background: slight tint of surface
- Row hover: subtle surface tint
- Keep first column “Title” left aligned and wider than others

### 5.7 Modals
- Max width: 560–720px
- Title + short description
- Footer actions: secondary left, primary right

### 5.8 Toasts
- Use for “Sent” confirmation, “Link copied”
- Auto-dismiss 3–5 seconds
- Don’t use toasts for errors requiring user action (use inline errors)

---

## 6) Navigation and information architecture

### 6.1 Primary nav (sidebar)
Recommended MVP items:
- **Library**
- **Patient delivery**
- **Saved**
- **Admin** (role-gated)

### 6.2 Page header pattern
Left: title + optional subtitle  
Right: primary action + secondary actions

---

## 7) Content patterns (MVP flows)

### 7.1 Library browse
- Search first
- Filters second (chips or a right-side filter panel)
- Sort: Relevance (default), Most used, Recently updated

### 7.2 Content detail
Show:
- Title
- Audience, format, estimated time
- “Last reviewed” date and clinical owner (trust signal)
- Summary (short)
- Actions: Send to patient, Copy link, Save

### 7.3 Patient delivery
- Recipient email
- Optional note (limit 280–400 chars)
- Preview snippet (first ~120 chars)
- Confirm send
- Success toast: “Sent to patient”

### 7.4 Empty states (copy examples)
- Library: “No results. Try a different tag or keyword.”
- Saved: “No saved items yet. Save handouts you use often.”
- Patient delivery history: “No sends yet.”

---

## 8) Iconography and imagery

### 8.1 Icon set
Use simple line icons (Lucide works well).
- Stroke: 1.75–2px
- Consistent size: 16px or 20px in buttons; 24px in headers

Recommended icons:
- Search, tag, bookmark, mail, copy, book-open, pathway/route

### 8.2 Imagery
- Use abstract clinical visuals and simple diagrams
- Avoid stock photos of people
- Keep imagery secondary to content

---

## 9) Motion
- Default transitions: 150–200ms
- Use motion only to clarify state changes (hover, open/close)
- Avoid bounce and playful effects

---

## 10) Accessibility (baseline standard)
- Contrast: meet WCAG AA for text
- Focus: visible focus ring on all interactive elements (`--ring`)
- Keyboard: sidebar, search, filters, and modals must be keyboard navigable
- Labels: every input needs a visible label or an accessible name

---

## 11) Writing standards (copy system)

### 11.1 Terminology
Use consistently:
- **Handout** (patient-facing)
- **Clinician brief** (clinician-facing)
- **Pathway** (structured sequence)
- **Next step** (recommended action)
- **Red flags** (urgent signals)

Avoid:
- “Homework” (use “home program” or “self-management”)
- “Hack” / “trick” / “secret”

### 11.2 Microcopy examples
- Primary CTA: **Send to patient**
- Secondary: **Copy link**, **Save**
- Form label: **Patient email**
- Helper: “We will send a secure link to this content.”

### 11.3 Error messages
- State the issue.
- State the fix.
Examples:
- “Enter a valid email address.”
- “Select at least one handout to send.”

---

## 12) Implementation guidance for Replit

### 12.1 Where to place this system
- `docs/STYLE_GUIDE.md` (this file)
- `styles/tokens.css` (CSS variables)
- `components/ui/*` (buttons, inputs, cards)
- Add a `ThemeProvider` if you support dark mode

### 12.2 Tailwind mapping (optional)
If you use Tailwind, map tokens to CSS vars so you keep one source of truth:
- `bg-[color:var(--bg)]`
- `text-[color:var(--text)]`
- `border-[color:var(--border)]`
- `rounded-[var(--radius)]`

### 12.3 Component checklist (MVP)
- Button (primary/secondary/ghost/destructive)
- Input + label + error state
- Search input
- Card (library tile)
- Badge/chip
- Modal
- Toast
- Tabs or filter chips

---

## 13) QA checklist (ship-ready consistency)
- One primary button per page
- All screens use the spacing scale
- Text hierarchy is consistent
- Focus rings visible on keyboard navigation
- Empty states exist for each list screen
- “Last reviewed” appears on content detail
- Dark mode (if enabled) meets contrast and keeps tokens consistent

---

## 14) Appendix: Suggested taxonomy (MVP)
**Intent:** Education | Self-management | Prevention | Red flags | Next step  
**Mechanism lens:** Mechanical | Neurogenic | Inflammatory | Sensitivity | Lifestyle  
**Format:** 1-page handout | Clinician brief | Script | Exercise set  
**Audience:** Patient | Clinician | Care team
