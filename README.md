# pdf-fixer — Επιδιόρθωση PDF

Μικρή εφαρμογή που διορθώνει «χαλασμένα» PDF **μέσα στο πρόγραμμα περιήγησης**
(MuPDF σε WASM). Το αρχείο δεν ανεβαίνει πουθενά — όλα γίνονται στη συσκευή σου.

Διορθώνει αρχεία σαν αυτά που βγάζει το *Foxit PhantomPDF Printer* (λανθασμένα
cross-reference streams), που σε κάποια προγράμματα (π.χ. Preview/Safari) δείχνουν
σελίδες διπλές ή ανακατεμένες, ενώ σε άλλα (Opera/Chrome) φαίνονται καλά.

## Τρέξιμο για ανάπτυξη

```sh
npm install
npm run dev        # Vite dev server, άνοιξε το URL που τυπώνει
```

## Production build + preview

```sh
npm run build      # βγάζει το static site στο dist/
npm run preview    # σερβίρει το dist/ τοπικά για δοκιμή
```

## Scripts ελέγχου

```sh
npm run smoke      # ανοίγει το ~/Downloads/Broken.pdf με το mupdf (Node)
                   # και σώζει /tmp/mupdf-fixed.pdf
node scripts/e2e.mjs
                   # ξεκινάει στατικό server (python3 http.server :4783)
                   # πάνω στο dist/, ανοίγει τη σελίδα σε headless Chromium,
                   # ανεβάζει το Broken.pdf και αποθηκεύει το αποτέλεσμα
                   # στο scripts/webapp-fixed.pdf
```

## Δημοσίευση σε GitHub Pages

Δεν χρειάζεται server. Σπρώξε το περιεχόμενο του `dist/`:

```sh
npm run build
# π.χ. σε branch `gh-pages`:
git subtree push --prefix dist origin gh-pages
```

ή χρησιμοποίησε GitHub Actions (`actions/deploy-pages` / `JamesIves/...`).
Το Vite build έχει `base: './'`, οπότε δουλεύει και σε υποδιαδρομή π.χ.
`https://<user>.github.io/pdf-fixer/`.

> Σημείωση: το wasm του MuPDF είναι ~10 MB· το πρώτο φόρτωμα κατεβάζει τόσο.
> Γι’ αυτό η εφαρμογή δηλώνει «ready» όταν φορτώσει, πριν δεχτεί αρχεία.

## Δομή

```
index.html          UI (ελληνικά, mobile-first)
src/main.ts         λογική: file → openDocument → saveToBuffer → download
src/style.css       στυλ (με dark mode)
scripts/smoke.mjs   node-level έλεγχος επιδιόρθωσης
scripts/e2e.mjs     browser-level έλεγχος (Playwright)
```

Εξάρτηση μόνο: [`mupdf`](https://www.npmjs.com/package/mupdf) (Artifex).
