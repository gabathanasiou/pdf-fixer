# pdf-fixer: Επιδιόρθωση PDF

Μικρή εφαρμογή που διορθώνει «χαλασμένα» PDF **μέσα στο πρόγραμμα περιήγησης**
(MuPDF σε WASM). Το αρχείο δεν ανεβαίνει πουθενά, όλα γίνονται στη συσκευή σου.

Διορθώνει αρχεία σαν αυτά που βγάζει το *Foxit PhantomPDF Printer* (λανθασμένα
cross-reference streams), που σε κάποια προγράμματα (π.χ. Preview/Safari) δείχνουν
σελίδες διπλές ή ανακατεμένες, ενώ σε άλλα (Opera/Chrome) φαίνονται καλά.

## Τι κάνει

- Ξαναχτίζει τη δομή του αρχείου και τον πίνακα cross-reference.
- Αφαιρεί διπλές, περιττές ενδείξεις `%%EOF` και `startxref`.
- Ξανασυμπιέζει και καθαρίζει το έγγραφο με το MuPDF.
- Αφήνει το αρχικό αρχείο άθικτο. Το διορθωμένο αποθηκεύεται ως `<name>-fixed.pdf`.

Περισσότερες λεπτομέρειες υπάρχουν μέσα στην εφαρμογή, στο κουμπί πληροφοριών (ⓘ)
πάνω δεξιά.

## Γλώσσα

Προεπιλογή τα **ελληνικά**· το κουμπί με τη σημαία πάνω δεξιά αλλάζει σε αγγλικά
(σημαία Ηνωμένου Βασιλείου). Η επιλογή αποθηκεύεται τοπικά (`pdf-fixer:lang`) και
θυμάται στο επόμενο άνοιγμα.

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
npm run og         # ξαναφτιάχνει το og-image.png και τα εικονίδια
```

## Δημοσίευση

### GitHub Pages

Δεν χρειάζεται server. Το workflow `.github/workflows/deploy.yml` χτίζει το
`dist/` σε κάθε push στο `main`. Το Vite build έχει `base: './'`, οπότε δουλεύει
και σε υποδιαδρομή π.χ. `https://<user>.github.io/pdf-fixer/`.

### Netlify

Το `netlify.toml` ορίζει build `npm run build` και publish `dist/`, μαζί με
headers ασφάλειας και caching. Σύνδεσε το repo στο Netlify και θα κάνει deploy
μόνο του.

> Σημείωση: το wasm του MuPDF είναι ~10 MB· το πρώτο φόρτωμα κατεβάζει τόσο.
> Γι' αυτό η εφαρμογή δηλώνει «ready» όταν φορτώσει, πριν δεχτεί αρχεία.

> Το canonical URL, το sitemap και τα Open Graph tags χρησιμοποιούν το
> placeholder `https://pdf-fixer.netlify.app/`. Άλλαξέ το σε `index.html`,
> `public/robots.txt` και `public/sitemap.xml` όταν έχεις το πραγματικό domain.

## Δομή

```
index.html                     κέλυφος: SEO head + <main id="app"> mount point
src/main.ts                    composition root: φορτώνει components + ροή αρχείων
src/components/                Header, DropZone, AutoDownload, ResultList, ResultRow, InfoDialog
src/lib/dom.ts                 el(), ο μόνος builder DOM
src/lib/repair.ts              επιδιόρθωση με MuPDF (καθαρή λογική)
src/lib/download.ts            outputName() / triggerDownload()
src/lib/flags.ts               σημαίες (SVG data URIs) + otherLang()
src/lib/icons.ts               εικονίδια (info, close)
src/i18n.ts                    κατάλογοι el/en, t(), setLang(), applyStatic()
src/style.css                  στυλ, dark mode, info modal
public/                        SEO αρχεία (robots, sitemap, manifest, 404, εικόνες)
netlify.toml                   Netlify build + headers
scripts/smoke.mjs              node-level έλεγχος επιδιόρθωσης
scripts/e2e.mjs                browser-level έλεγχος (Playwright)
scripts/og-image.mjs           δημιουργία og-image + εικονιδίων
AGENTS.md                      οδηγίες για agents
docs/                          ARCHITECTURE.md, I18N.md
```

Εξάρτηση μόνο: [`mupdf`](https://www.npmjs.com/package/mupdf) (Artifex).
