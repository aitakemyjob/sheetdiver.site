// SheetDiver site interactions: agent snippet tabs, copy buttons, a
// screenshot lightbox, an OS-aware download button and live release info
// from the GitHub API. No dependencies.

/** Switches the visible agent configuration snippet. */
function initTabs() {
  const tabs = document.querySelectorAll('.tabs [role="tab"]');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
      document.querySelectorAll('.connect .snippet[data-panel]').forEach((p) => {
        p.hidden = p.dataset.panel !== tab.dataset.tab;
      });
    });
  });
}

/** Copies a snippet's code (minus leading comment lines) to the clipboard. */
function initCopyButtons() {
  document.querySelectorAll('.snippet .copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.parentElement.querySelector('code').textContent
        .split('\n')
        .filter((line) => !line.trim().startsWith('//'))
        .join('\n')
        .trim();
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = 'Copied';
        btn.classList.add('done');
      } catch {
        btn.textContent = 'Select & copy';
      }
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('done');
      }, 1600);
    });
  });
}

/** Opens screenshots full-size; closes on click, the × button or Escape. */
function initLightbox() {
  const box = document.getElementById('lightbox');
  const img = box.querySelector('img');
  const caption = box.querySelector('.lightbox-caption');
  let lastFocus = null;
  const close = () => {
    box.hidden = true;
    document.body.style.overflow = '';
    lastFocus?.focus();
  };
  document.querySelectorAll('.shot').forEach((fig) => {
    fig.tabIndex = 0;
    fig.setAttribute('role', 'button');
    const open = () => {
      const thumb = fig.querySelector('img');
      lastFocus = fig;
      img.src = fig.dataset.full || thumb.src;
      img.alt = thumb.alt;
      caption.textContent = fig.querySelector('figcaption')?.textContent ?? '';
      box.hidden = false;
      document.body.style.overflow = 'hidden';
      box.querySelector('.lightbox-close').focus();
    };
    fig.addEventListener('click', open);
    fig.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });
  box.addEventListener('click', (e) => {
    if (e.target !== img) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !box.hidden) close();
  });
}

/** Labels the hero download button for the visitor's operating system. */
function initDownloadLabel() {
  const btn = document.getElementById('download-btn');
  const ua = navigator.userAgent;
  const os = /Mac/i.test(ua) ? 'macOS' : /Win/i.test(ua) ? 'Windows' : /Linux/i.test(ua) ? 'Linux' : '';
  if (btn && os) btn.textContent = `Download for ${os}`;
}

/** Toggles the collapsed navigation on small screens. */
function initMenu() {
  const nav = document.querySelector('.nav');
  const btn = nav.querySelector('.menu-toggle');
  const set = (open) => {
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  btn.addEventListener('click', () => set(!nav.classList.contains('open')));
  nav.querySelectorAll('.nav-links a').forEach((a) => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && set(false));
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => e.matches && set(false));
}

const REPO = 'aitakemyjob/sheetdiver';
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases?per_page=12`;

/** Creates an element with attributes and children (strings become text). */
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c !== null && c !== undefined && c !== false) node.append(c);
  }
  return node;
}

/** Formats an ISO date like "October 16, 2026". */
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Formats a byte count like "10.4 MB". */
function formatSize(bytes) {
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

/**
 * Pulls the "What's Changed" bullets GitHub generates into release notes:
 * "* Title by @user in https://…/pull/6" → { title, url }.
 */
function changesFrom(body = '') {
  // Releases lead with the changelog ("## What's new in X"): show each
  // top-level item's first sentence.
  const highlights = body.split(/^## What's new.*$/m)[1]?.split(/^## /m)[0];
  if (highlights) {
    const items = [];
    for (const line of highlights.split('\n')) {
      if (/^- /.test(line)) items.push(line.slice(2));
      else if (/^\s+\S/.test(line) && items.length) items[items.length - 1] += ' ' + line.trim();
    }
    if (items.length) return items.map((t) => ({ title: firstSentence(plain(t)) }));
  }
  // Otherwise GitHub's generated list of merged PRs, which may be grouped
  // under "### Category" headings.
  const section = body.split(/^## What's Changed\s*$/m)[1];
  if (!section) return [];
  const out = [];
  for (const line of section.split('\n')) {
    if (/^\s*(## |\*\*Full Changelog)/.test(line)) break;
    const m = line.match(/^\s*[*-]\s+(.+?)(?:\s+by\s+@[\w[\]-]+)?(?:\s+in\s+(https:\/\/\S+))?\s*$/);
    if (m) out.push({ title: m[1], url: m[2] });
  }
  return out;
}

/** Markdown inline formatting reduced to text. */
function plain(md) {
  return md.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/(\*\*|__|`)/g, '');
}

/** The first sentence of a changelog item, kept short. */
function firstSentence(text) {
  const s = text.match(/^.+?[.;](?=\s|$)/)?.[0] ?? text;
  return s.length > 140 ? s.slice(0, 137).trimEnd() + '…' : s.replace(/;$/, '.');
}

/** The download links worth showing for a release, by platform. */
function downloadsFor(release) {
  const byName = new Map(release.assets.map((a) => [a.name, a]));
  const pick = (label, name, hint) => {
    const a = byName.get(name);
    return a ? { label, hint, url: a.browser_download_url, size: a.size } : null;
  };
  return [
    pick('macOS', 'sheetdiver_darwin_universal.zip', 'Apple Silicon + Intel'),
    pick('Windows', 'sheetdiver_windows_amd64_installer.exe', 'Installer'),
    pick('Linux .deb', 'sheetdiver_linux_amd64.deb', 'x64'),
    pick('Linux .rpm', 'sheetdiver_linux_amd64.rpm', 'x64'),
    pick('Linux ARM64', 'sheetdiver_linux_arm64.deb', '.deb'),
  ].filter(Boolean);
}

/** Renders one release as a card. */
function releaseCard(release, kind, first = false) {
  const changes = changesFrom(release.body);
  const downloads = downloadsFor(release);
  const badge = kind === 'latest' ? el('span', { class: 'badge stable' }, 'Latest') : el('span', { class: 'badge preview' }, 'Pre-release');
  return el('article', { class: `release-card ${kind}` },
    el('div', { class: 'release-head' },
      el('h3', {}, el('a', { href: release.html_url }, release.tag_name)),
      badge,
      el('span', { class: 'release-date' }, formatDate(release.published_at)),
    ),
    first ? el('p', { class: 'release-sub' }, 'The first public release: the desktop app, its built-in MCP server, the parts catalogue, and installers for every platform.') : null,
    kind === 'preview' ? el('p', { class: 'release-sub' }, "Try what's coming next. Pre-releases are tested in CI but may change before the final release.") : null,
    changes.length
      ? el('ul', { class: 'release-notes' }, changes.slice(0, 6).map((c) => el('li', {}, c.url ? el('a', { href: c.url }, c.title) : c.title)))
      : el('p', { class: 'release-sub' }, 'See the release notes for details.'),
    el('div', { class: 'release-downloads' },
      downloads.map((d) => el('a', { class: 'dl', href: d.url, title: `${d.hint} · ${formatSize(d.size)}` }, d.label, el('span', {}, formatSize(d.size)))),
      el('a', { class: 'dl more', href: release.html_url }, 'All files & notes'),
    ),
  );
}

/** Fetches releases, cached for ten minutes per browser session. */
async function fetchReleases() {
  const key = 'sd.releases';
  try {
    const cached = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (cached && Date.now() - cached.at < 600000) return cached.data;
  } catch {
    /* storage unavailable: fetch fresh */
  }
  const res = await fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const data = (await res.json()).filter((r) => !r.draft);
  try {
    sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* fine without a cache */
  }
  return data;
}

/**
 * Shows the latest release (and a newer pre-release, if any) with download
 * links and what changed, plus earlier versions. Keeps the static fallback
 * when the API is unreachable.
 */
async function initReleases() {
  const grid = document.getElementById('release-grid');
  if (!grid) return;
  let releases;
  try {
    releases = await fetchReleases();
  } catch {
    return;
  }
  const latest = releases.find((r) => !r.prerelease);
  if (!latest) return;
  const preview = releases.find((r) => r.prerelease && new Date(r.published_at) > new Date(latest.published_at));
  const firstStable = !releases.some((r) => !r.prerelease && r !== latest);
  const cards = [releaseCard(latest, 'latest', firstStable)];
  if (preview) cards.push(releaseCard(preview, 'preview'));
  const earlier = releases.filter((r) => r !== latest && r !== preview).slice(0, 5);
  grid.replaceChildren(...cards);
  grid.classList.toggle('two', cards.length > 1);
  if (earlier.length) {
    grid.after(
      el('div', { class: 'release-earlier' },
        el('h3', {}, 'Earlier releases'),
        el('ul', {}, earlier.map((r) =>
          el('li', {},
            el('a', { href: r.html_url }, r.tag_name),
            r.prerelease ? el('span', { class: 'badge preview' }, 'Pre-release') : null,
            el('span', { class: 'release-date' }, formatDate(r.published_at)),
          ))),
      ),
    );
  }

  const version = document.querySelector('#hero-version a');
  if (version) version.textContent = `Latest release: ${latest.tag_name} · ${formatDate(latest.published_at)}`;

  // Point the hero button straight at the right file for this OS.
  const btn = document.getElementById('download-btn');
  const ua = navigator.userAgent;
  const want = /Mac/i.test(ua) ? 'sheetdiver_darwin_universal.zip' : /Win/i.test(ua) ? 'sheetdiver_windows_amd64_installer.exe' : '';
  const asset = latest.assets.find((a) => a.name === want);
  if (btn && asset) btn.href = asset.browser_download_url;
  else if (btn && /Linux/i.test(ua)) btn.href = '#releases';
}

initMenu();
initTabs();
initCopyButtons();
initLightbox();
initDownloadLabel();
initReleases();
