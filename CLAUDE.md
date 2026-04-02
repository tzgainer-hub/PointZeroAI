# Point Zero AI — Website Project
## CLAUDE.md — Persistent Project Instructions

Read this file completely before doing any work in this project.

---

## What This Site Is

**pointzeroai.com** is the main company website for Point Zero AI — Tom Zgainer's AI education and product company. It is NOT a landing page for a single product. It is the umbrella brand hub that showcases everything Point Zero AI does.

**Who built it:** Claude Code (Claude AI) built this site. It was not built by a human web designer or agency. All future changes are made here in Claude Code by Tom.

---

## Repository & Deployment

- **GitHub:** https://github.com/tzgainer-hub/PointZeroAI.git
- **Live URL:** https://www.pointzeroai.com
- **Deploy:** Auto-deploy via Railway on every push to `main`
- **Stack:** Static HTML + inline CSS + Vanilla JS. Express server (server.js) serves static files from `/public/`
- **Local path:** `/Users/thomaszgainer/PointZeroAI/`
- **Google Analytics ID:** G-GSGMQREKGT (on all pages)

**To deploy any change:**
```bash
cd /Users/thomaszgainer/PointZeroAI
git add [files]
git commit -m "description"
git push
```
Railway picks it up automatically. Live in ~60 seconds.

---

## File Structure

```
PointZeroAI/
├── public/
│   ├── index.html           ← Main homepage
│   ├── ai-business-stack.html ← "60-Day AI Business Stack" scorecard page
│   └── masterclass.html     ← Point Zero AI Masterclass landing page
├── server.js                ← Express static file server
├── package.json
└── CLAUDE.md                ← This file
```

---

## Design System — Never Deviate From These

### CSS Custom Properties (defined inline in each page `<style>` block)
```css
--navy-dark:  #0c1e3c   /* Body background — deep navy */
--navy-mid:   #152847
--navy-light: #1e3a5f
--gold:       #c9a447   /* Primary accent — gold/amber */
--gold-light: #e8c46a
--white:      #ffffff
--off-white:  #f4f6f9
--text-dark:  #1a2e4a
--text-muted: #6b7c93
```

### Typography
- **Headlines:** `Outfit` (wght 700/800) — bold, modern, confident
- **Body:** `Inter` (wght 300–600) — clean, readable
- Google Fonts: `Outfit` + `Inter` linked in every page `<head>`

### Visual Tone
- Dark navy background throughout — premium, serious, not clinical
- Gold accents for CTAs, highlights, important numbers
- NOT bright/colorful — sophisticated and trustworthy
- The audience is 50+ business professionals, not young tech workers

---

## Pages — What Each One Does

### index.html (Homepage)
The main brand hub. Contains:
- **Header:** "POINT ZERO AI" logo + tagline
- **Hero section:** Tom's value proposition — "AI for Business Owners and Professionals Over 50"
- **Products section:** Cards for all active Point Zero AI products
- **60-Day Scorecard section:** Stats showing what was built in 60 days (links to ai-business-stack page)
- **AI Business Assessment CTA:** Email link for assessment inquiries
- **Footer:** Social links + site links

**Products currently shown on homepage:**
1. **StreamTracker** — Live on App Store · getstreamtracker.com
2. **White Coat Websites** — Now Available · links to dental-prototype-production.up.railway.app

### ai-business-stack.html (/ai-business-stack)
The "60-Day AI Business Stack" scorecard. A detailed table showing every tool Tom used to build the Point Zero AI business in 60 days — what he built, which AI tools, what it costs per month, and what the old-world alternative would have cost.

**Current scorecard rows include:**
- Premium professional website product (White Coat Websites — Claude + Railway — ~$20/mo — vs. $10K–$25K agency)
- StreamTracker app (Claude Code + Railway)
- Point Zero AI website (Claude Code)
- Point Zero AI Masterclass (Teachable + Claude)
- YouTube channel / content system
- 401k consulting workflow
- (and more)

**Key message of this page:** Tom built a complete business infrastructure in 60 days using AI, for ~$50–100/month total, that would have cost $200K+ the traditional way.

### masterclass.html (/masterclass)
Landing page for the Point Zero AI Masterclass ($797). 8 modules, 44 videos. Target: business owners 50+ intimidated by AI.

---

## Tom Zgainer — Context That Matters Here

- **Founder** of Point Zero AI
- **Background:** 30+ years in 401(k) consulting, helped 8,000+ businesses, featured in Tony Robbins' *MONEY Master the Game* and *Unshakeable*
- **Current role:** Creative Planning (AB401k) + building Point Zero AI
- **The gap he fills:** Every AI educator targets young techies. Tom speaks to experienced business owners who find AI intimidating.
- **Communication style:** Direct, plain English, no jargon, no fluff. He will learn anything if it's explained well.
- **His audience:** Business professionals 50+ — not coders, not startups

---

## Products in the Point Zero AI Ecosystem

| Product | Status | URL | Notes |
|---------|--------|-----|-------|
| Point Zero AI Masterclass | Active | /masterclass | $797 · 8 modules · 44 videos |
| StreamTracker | Live | getstreamtracker.com | SaaS app — built with Claude Code |
| White Coat Websites | Active | dental-prototype-production.up.railway.app | Premium sites for healthcare practices — $2,500 |
| AI Business Assessment | Active | Email CTA | info@pointzeroai.com |

---

## White Coat Websites — Important Context

This is Tom's newest product. Key facts to remember:

- **What it is:** Premium custom websites for healthcare professionals ("white coats") — dentists, oral surgeons, specialists, physicians, any practice where the doctor's reputation is the brand
- **Pricing:** Option A: $1,599 + $149/mo | Option B: $2,500 flat (recommended) — includes 12 months hosting
- **Demo:** https://dental-prototype-production.up.railway.app (Scottsdale Surgical Arts — oral surgery practice)
- **Sales system:** Full closer toolkit at dental-prototype-production.up.railway.app/hub.html
- **Dental is the beachhead** — Tom has 900 existing dental contacts. White coats is the broader market.
- **DO NOT use dental-specific language on pointzeroai.com** — use "physicians, surgeons, specialists, white coat practices"
- **Separate project/repo:** Lives at `/Users/thomaszgainer/Desktop/ClaudeWork /dental-prototype/` with its own CLAUDE.md

---

## What NOT to Change Without Tom's Approval

- Pricing on any product
- The "60-Day" framing on the scorecard (it's accurate and intentional)
- Tom's credentials or background statements
- The Gold/Navy color scheme
- Product names

---

## Common Tasks

### Adding a new product card to the homepage
Find the `.products-grid` div in `public/index.html`. Add a new `.product-card` div following the same pattern as existing cards. Always include: badge, h3 title, p description, product-link anchor.

### Adding a row to the AI Business Stack scorecard
Find the `<tbody>` in `public/ai-business-stack.html`. Add a `<tr>` with 4 `<td>` cells: What was built | Tool used | Monthly cost | Old-world alternative.

### Updating the 60-day stats on the homepage
Find the `.scorecard-grid` section in `public/index.html`. Each `.stat-card` has a `.number` and a `.label`. Keep numbers bold and specific.

---

## Related Projects

| Project | Local Path | Live URL | Repo |
|---------|-----------|----------|------|
| Point Zero AI site | `/Users/thomaszgainer/PointZeroAI/` | pointzeroai.com | tzgainer-hub/PointZeroAI |
| White Coat Websites (dental demo) | `/Users/thomaszgainer/Desktop/ClaudeWork /dental-prototype/` | dental-prototype-production.up.railway.app | tzgainer-hub/dental-prototype |
| StreamTracker | (separate project) | getstreamtracker.com | (separate repo) |

---

*Point Zero AI · onboarding@pointzeroai.com · pointzeroai.com*
*This file: /Users/thomaszgainer/PointZeroAI/CLAUDE.md*
