# sheetdiver.site

The landing page for [SheetDiver](https://github.com/aitakemyjob/sheetdiver):
a datasheet library for electronics design, shared with your AI agent over
MCP.

A single static page with no build step: `index.html`, `styles.css`,
`main.js` and `assets/`. Served with GitHub Pages from the `main` branch.

## Preview locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Screenshots

`assets/screens/` holds real screenshots of SheetDiver at 1420×802 in the
Paper (light) theme: a library of real datasheets (TI, ST, Analog Devices,
Samsung, Murata and others) and a real board project, with an agent driving
it over MCP for the comparison, calculator and walkthrough shots. They were
captured from a headless Chrome with the app's `show` tools.

## Releases

The **Releases** section and the hero's "Latest release" line are filled in
at load time from the GitHub API (`/repos/aitakemyjob/sheetdiver/releases`),
cached for ten minutes per browser session. Each card shows the release's
changelog highlights (or GitHub's generated "What's Changed" list) and direct
download links. If the API is unreachable, the static card in `index.html`
stays in place.

## Style

The same light, flat theme as codediver.site, recoloured from the SheetDiver
logo: navy text on soft off-white, the diver's blue as the accent and the
water's cyan as the second (darker variants where they're used as text, for
contrast). Code snippets are dark panels; the app screenshots use the app's
light Paper theme, so they sit on the page without a dark block. No
gradients or glows.
