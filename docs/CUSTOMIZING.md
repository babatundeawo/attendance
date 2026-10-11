# Customizing the register

Edit files on GitHub by opening them and clicking the **pencil** icon. Save with **Commit changes**; the site is rebuilt automatically.

## Term dates

File: `src/config.js`

- `TERM_START`: the Monday the term begins, written `YYYY-MM-DD` (for example `"2026-09-14"`).
- `WEEKS`: how many weeks the term has.
- `AT_RISK_BELOW`: the percentage under which a student is marked "At risk" in the term report.

## Colors

File: `src/styles/tokens.css`. The colors are named, so change the value on the right of the colon.

- `--primary`: the main blue used for buttons and highlights.
- `--accent`: the brass accent.
- `--bg`, `--surface`, `--text`: page background, cards, and text.
- Dark mode has its own set under `:root[data-theme="dark"]` (and a matching block for devices set to dark).

## Fonts

- Fonts are listed in `src/styles/fonts.css` and named in `src/styles/tokens.css` (`--font-display` for headings, `--font-body` for text).
- The included fonts are **Fraunces** and **Inter**. To change one, a developer must add the new font file; ask for help before swapping.

## Text and labels

- Page text and form labels: `index.html`.
- Names of the five tabs: `TABS` list at the top of `src/main.js`.
- Messages shown on the sign-in page: `src/auth.js`.

## Logo and icons

- Logo and favicon: `public/icon.svg`.
- App icons for phones: PNG files in `public/icons/` (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`). Replace each with a new picture of the **same size and name**.
- Link-preview picture: `public/og-image.png` (1200 x 630 pixels).

## Who can sign in

Not in the code. See `FIREBASE_LOGIN_SETUP.md`, Steps 4 and 5.
