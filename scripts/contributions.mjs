// Builds Images/contributions.svg (3D isometric contribution card) from the public profile calendar.
// Runs in GitHub Actions — see .github/workflows/snake.yml
import { writeFileSync } from 'node:fs';

const USER = process.env.GH_USER || 'ahmedsamir010';

export function parse(html) {
  const tips = {};
  for (const m of html.matchAll(/<tool-tip[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) tips[m[1]] = m[2].trim();
  const days = [];
  for (const m of html.matchAll(/<td\b[^>]*class="ContributionCalendar-day"[^>]*>/g)) {
    const tag = m[0], date = tag.match(/data-date="([\d-]+)"/), id = tag.match(/\bid="([^"]+)"/);
    if (!date) continue;
    const c = (tips[id?.[1]] || '').match(/^(\d[\d,]*) contribution/);
    days.push([date[1], c ? +c[1].replace(/,/g, '') : 0]);
  }
  return days.sort((a, b) => (a[0] < b[0] ? -1 : 1));
}

export function gen(counts, start) {
  const first = new Date(start + 'T00:00:00Z').getUTCDay();
  const cells = counts.map((c, i) => ({ c, w: Math.floor((i + first) / 7), d: (i + first) % 7 }));
  const weeks = cells[cells.length - 1].w + 1;
  const total = counts.reduce((a, b) => a + b, 0);
  let best = 0, cur = 0, active = 0;
  counts.forEach(c => { if (c > 0) { cur++; active++; best = Math.max(best, cur); } else cur = 0; });
  const bestDay = Math.max(...counts);
  const a = 16, b = 6.4, ox = 1200 / 2 - ((weeks - 7) * a) / 2, oy = 182;
  const P = (i, j, h) => [+(ox + (i - j) * a).toFixed(1), +(oy + (i + j) * b - h).toFixed(1)];
  const lvl = c => c === 0 ? 0 : c < 4 ? 1 : c < 10 ? 2 : c < 21 ? 3 : 4;
  const pal = [null,
    ['#3B2A7A', '#2A1E5C', '#21184A'], ['#5B3FC4', '#4630A0', '#37267E'],
    ['#7C5CF0', '#6246CC', '#4D37A6'], ['#C4B5FD', '#9F86F7', '#7C62E0']];
  const pts = arr => arr.map(p => p.join(',')).join(' ');
  const g = 0.12;
  const out = [];
  cells.sort((p, q) => (p.w + p.d) - (q.w + q.d) || p.w - q.w).forEach(({ c, w, d }) => {
    const i0 = w + g, i1 = w + 1 - g, j0 = d + g, j1 = d + 1 - g, L = lvl(c);
    if (!L) { out.push(`<polygon class="t" points="${pts([P(i0, j0, 0), P(i1, j0, 0), P(i1, j1, 0), P(i0, j1, 0)])}"/>`); return; }
    const h = 5 + Math.sqrt(Math.min(c, 120)) * 9, [top, left, right] = pal[L];
    out.push(`<g class="b" style="animation-delay:${(w * 0.025).toFixed(2)}s">` +
      `<polygon fill="${left}" points="${pts([P(i0, j1, 0), P(i1, j1, 0), P(i1, j1, h), P(i0, j1, h)])}"/>` +
      `<polygon fill="${right}" points="${pts([P(i1, j0, 0), P(i1, j1, 0), P(i1, j1, h), P(i1, j0, h)])}"/>` +
      `<polygon fill="${top}" points="${pts([P(i0, j0, h), P(i1, j0, h), P(i1, j1, h), P(i0, j1, h)])}"/></g>`);
  });
  const n = x => x.toLocaleString('en-US');
  const stat = (x, y, v, l) => `<text x="${x}" y="${y}" class="f" font-size="30" font-weight="800" fill="#F5F3FF" text-anchor="end">${v}</text><text x="${x}" y="${y + 22}" class="f" font-size="13" fill="#94A3B8" text-anchor="end" letter-spacing=".5">${l}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="580" viewBox="0 0 1200 580">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#05070F"/><stop offset="1" stop-color="#0A0F22"/></linearGradient>
<linearGradient id="tt" x1="0" x2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C4B5FD"/></linearGradient>
<radialGradient id="gl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#7C3AED" stop-opacity=".3"/><stop offset="1" stop-color="#7C3AED" stop-opacity="0"/></radialGradient>
<clipPath id="k"><rect width="1200" height="580" rx="24"/></clipPath>
<style>
.f{font-family:'Segoe UI',-apple-system,'Helvetica Neue',Arial,sans-serif}
.m{font-family:'Cascadia Code','SF Mono',Consolas,monospace}
.t{fill:#151B36}
.b{opacity:0;animation:up .7s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes fi{from{opacity:0}to{opacity:1}}
.h{opacity:0;animation:fi .8s ease-out .2s forwards}
@keyframes pulse{0%,100%{opacity:.35}50%{opacity:1}}
.p{animation:pulse 2s ease-in-out infinite}
</style>
</defs>
<g clip-path="url(#k)">
<rect width="1200" height="580" fill="url(#bg)"/>
<circle cx="980" cy="420" r="340" fill="url(#gl)"/>
<g class="h">
<text x="56" y="62" class="m" font-size="12" fill="#64748B" letter-spacing="2">CONTRIBUTIONS · LAST 12 MONTHS</text>
<text x="54" y="122" class="f" font-size="56" font-weight="800" fill="url(#tt)" letter-spacing="-1.5">${n(total)}</text>
${stat(1144, 76, best + ' days', 'LONGEST STREAK')}
${stat(1144, 146, n(bestDay), 'BEST DAY')}
${stat(1144, 216, n(active), 'ACTIVE DAYS')}
</g>
${out.join('\n')}
<g class="h" transform="translate(56 548)">
<text class="m" font-size="11" fill="#475569" letter-spacing="1">LESS</text>
<rect x="44" y="-10" width="12" height="12" rx="3" fill="#151B36"/>
<rect x="62" y="-10" width="12" height="12" rx="3" fill="#3B2A7A"/>
<rect x="80" y="-10" width="12" height="12" rx="3" fill="#5B3FC4"/>
<rect x="98" y="-10" width="12" height="12" rx="3" fill="#7C5CF0"/>
<rect x="116" y="-10" width="12" height="12" rx="3" fill="#C4B5FD"/>
<text x="138" class="m" font-size="11" fill="#475569" letter-spacing="1">MORE</text>
</g>
</g>
<rect x=".5" y=".5" width="1199" height="579" rx="24" fill="none" stroke="#FFFFFF" stroke-opacity=".08"/>
</svg>`;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const res = await fetch(`https://github.com/users/${USER}/contributions`, { headers: { 'User-Agent': 'profile-card' } });
  if (!res.ok) throw new Error(`calendar fetch failed: ${res.status}`);
  const days = parse(await res.text());
  if (days.length < 300) throw new Error(`unexpected calendar size: ${days.length}`);
  writeFileSync('Images/contributions.svg', gen(days.map(d => d[1]), days[0][0]));
  console.log(`ok: ${days.length} days, ${days.reduce((s, d) => s + d[1], 0)} contributions`);
}
