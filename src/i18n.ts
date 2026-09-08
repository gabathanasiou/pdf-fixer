export type Lang = 'el' | 'en'

const STORAGE_KEY = 'pdf-fixer:lang'

const strings = {
  el: {
    title: 'Επιδιόρθωση PDF',
    docTitle: 'Επιδιόρθωση PDF | PDF Repair',
    subtitle:
      'Γειά σου μαμά, ανέβασε το χαλασμένο PDF και κατέβασε το διορθωμένο. Τίποτα δεν φεύγει από τη συσκευή σου. Η επεξεργασία γίνεται εδώ, στο πρόγραμμα περιήγησης.',
    dropAria: 'Πάτησε για να επιλέξεις αρχεία PDF',
    dropTitle: 'Πάτησε για να επιλέξεις αρχεία PDF',
    dropSub: 'Μπορείς να σύρεις και να αφήσεις τα αρχεία εδώ',
    autoDownload: 'Κατέβασε αυτόματα κάθε διορθωμένο αρχείο',
    langAria: 'Αλλαγή γλώσσας',
    soundAria: 'Ήχος',
    langButton: 'EN',
    infoButton: 'Τι κάνει η εφαρμογή;',
    infoTitle: 'Τι κάνει αυτή η εφαρμογή;',
    infoIntro:
      'Η εφαρμογή διορθώνει χαλασμένα PDF απευθείας μέσα στο πρόγραμμα περιήγησης. Αν ένα PDF ανοίγει με διπλές, χαμένες ή ανακατεμένες σελίδες σε κάποια προγράμματα, συνήθως μπορεί να ξαναχτιστεί σε ένα καθαρό και σωστό αρχείο. Δεν χρειάζεται να εγκαταστήσεις τίποτα και το αρχείο σου δεν φεύγει ποτέ από τη συσκευή σου.',
    infoWhyTitle: 'Γιατί χαλάνε τα PDF;',
    infoWhy:
      'Κάθε PDF έχει έναν πίνακα (τον πίνακα cross-reference) που λέει στους αναγνώστες πού βρίσκεται κάθε σελίδα και κάθε αντικείμενο. Κάποια προγράμματα, όπως ο εκτυπωτής Foxit PhantomPDF, γράφουν αυτόν τον πίνακα λάθος. Το αρχείο ανοίγει ακόμα σε ανεκτικούς αναγνώστες όπως το Chrome ή ο Opera, αλλά πιο αυστηροί αναγνώστες όπως το Preview ή το Safari δείχνουν διπλές ή ανακατεμένες σελίδες. Το περιεχόμενο είναι εντάξει, μόνο ο χάρτης που δείχνει σε αυτό είναι λάθος.',
    infoFixTitle: 'Τι διορθώνει η επιδιόρθωση;',
    infoFix1: 'Ξαναχτίζει την εσωτερική δομή του αρχείου και τον πίνακα cross-reference.',
    infoFix2: 'Αφαιρεί διπλές, περιττές ενδείξεις τέλους αρχείου (%%EOF) και startxref.',
    infoFix3: 'Ξανασυμπιέζει και καθαρίζει το έγγραφο με το MuPDF.',
    infoFix4: 'Αφήνει το αρχικό αρχείο άθικτο. Το διορθωμένο αποθηκεύεται ως <name>-fixed.pdf.',
    infoPrivacyTitle: 'Τα αρχεία σου μένουν ιδιωτικά',
    infoPrivacy:
      'Όλα τρέχουν μέσα στο πρόγραμμα περιήγησης με WebAssembly. Χωρίς server, χωρίς ανέβασμα, χωρίς παρακολούθηση. Το PDF επεξεργάζεται στη συσκευή σου και διαγράφεται μόλις κλείσεις τη σελίδα.',
    infoHowTitle: 'Πώς το χρησιμοποιείς;',
    infoHow1:
      'Σύρε ένα PDF στο κουτί ή πάτησε για να επιλέξεις. Μπορείς να διαλέξεις πολλά αρχεία μαζί.',
    infoHow2:
      'Περίμενε να τελειώσει η επιδιόρθωση. Το σήμα γίνεται πράσινο όταν το αρχείο είναι έτοιμο.',
    infoHow3:
      'Κατέβασε το διορθωμένο αρχείο ή ενεργοποίησε την αυτόματη λήψη για να αποθηκεύεται μόλις τελειώνει.',
    infoNoteTitle: 'Καλό να ξέρεις',
    infoNote1:
      'Δεν διορθώνεται κάθε χαλασμένο PDF. Αν το αρχείο είναι κρυπτογραφημένο ή πολύ κατεστραμμένο, η εφαρμογή θα σου το πει.',
    infoNote2:
      'Τα πολύ μεγάλα αρχεία μπορεί να πάρουν λίγα δευτερόλεπτα και περισσότερη μνήμη.',
    infoNote3: 'Το αρχικό αρχείο δεν αλλάζει ποτέ.',
    infoStoryTitle: 'Γιατί το έφτιαξα',
    infoStory:
      'Η μαμά μου ψέλνει στην εκκλησία και κατεβάζει τα PDF με τους ύμνους από έναν ιστότοπο. Παραπονιόταν συνέχεια ότι τα αρχεία ήταν χαλασμένα. Το έψαξα, βρήκα την αιτία και έφτιαξα αυτό το εργαλείο για να διορθώνει αυτά τα αρχεία. Το μοιράζομαι εδώ, μήπως βοηθήσει και κάποιον άλλον με το ίδιο πρόβλημα.',
    infoClose: 'Κλείσιμο',
    resultsTitle: 'Αποτελέσματα',
    queue: '{count} σε αναμονή',
    recentTitle: 'Πρόσφατα',
    historyNote: 'Τα τελευταία 5 αρχεία, για 30 ημέρες.',
    today: 'Σήμερα',
    yesterday: 'Χθες',
    deleteAria: 'Διαγραφή',
    expiredButton: 'Έληξε',
    expiredTitle: 'Το αρχείο έληξε',
    expiredMessage:
      'Οι διορθώσεις διαγράφονται μετά από 30 ημέρες για να ελευθερωθεί χώρος. Ανέβασε ξανά το αρχικό αρχείο για να το διορθώσεις.',
    ok: 'Εντάξει',
    clearAria: 'Καθαρισμός ιστορικού',
    clearTitle: 'Καθαρισμός ιστορικού',
    clearMessage: 'Να διαγραφούν όλα τα πρόσφατα αρχεία;',
    cancel: 'Άκυρο',
    confirmDelete: 'Διαγραφή',
    emptyHint: 'Τα διορθωμένα αρχεία θα εμφανιστούν εδώ.',
    busy: 'Σε εξέλιξη…',
    repairing: 'Επιδιόρθωση…',
    failed: 'Δεν τα κατάφερε',
    clean: 'Καλό PDF',
    pages: '{count} σελίδες',
    cleanNote: 'Δεν εντοπίστηκαν προβλήματα. Το αρχείο ήταν ήδη εντάξει.',
    ready: 'Έτοιμο',
    fixedOne: 'Διορθώθηκε 1 πρόβλημα στη δομή του PDF.',
    fixedMany: 'Διορθώθηκαν {count} προβλήματα στη δομή του PDF.',
    download: 'Λήψη του διορθωμένου',
    notPdf: 'Αυτό το αρχείο δεν είναι PDF (ή είναι κρυπτογραφημένο).',
    error: 'Σφάλμα: {msg}',
  },
  en: {
    title: 'PDF Repair',
    docTitle: 'PDF Repair | Fix broken PDFs in your browser',
    subtitle:
      'Hi mom, upload the broken PDF and download the repaired version. Nothing leaves your device. Everything happens right here in the browser.',
    dropAria: 'Press to choose PDF files',
    dropTitle: 'Press to choose PDF files',
    dropSub: 'You can also drag and drop files here',
    autoDownload: 'Automatically download every repaired file',
    langAria: 'Change language',
    soundAria: 'Sound',
    langButton: 'ΕΛ',
    infoButton: 'What does this do?',
    infoTitle: 'What does this app do?',
    infoIntro:
      'This app repairs broken PDF files directly in your browser. If a PDF opens with duplicated, missing, or scrambled pages in some viewers, it can usually be rebuilt into a clean, correct file. You do not need to install anything, and your file never leaves your device.',
    infoWhyTitle: 'Why do PDFs break?',
    infoWhy:
      'Every PDF stores a table (the cross-reference table) that tells readers where each page and object lives. Some tools, such as the Foxit PhantomPDF Printer, write this table incorrectly. The file still opens in tolerant readers like Chrome or Opera, but stricter readers such as Preview or Safari show duplicated or shuffled pages. The content is fine, only the map that points to it is wrong.',
    infoFixTitle: 'What does the repair do?',
    infoFix1: 'Rebuilds the internal structure of the file and its cross-reference table.',
    infoFix2: 'Removes leftover duplicate end-of-file (%%EOF) and startxref markers.',
    infoFix3: 'Recompresses and cleans the document with MuPDF.',
    infoFix4: 'Leaves your original file untouched. The repaired copy is saved as <name>-fixed.pdf.',
    infoPrivacyTitle: 'Your files stay private',
    infoPrivacy:
      'Everything runs inside your browser using WebAssembly. No server, no upload, no tracking. Your PDF is processed on your device and discarded when you close the page.',
    infoHowTitle: 'How do you use it?',
    infoHow1: 'Drop a PDF onto the box or tap to choose one. You can select several files at once.',
    infoHow2: 'Wait for the repair to finish. The badge turns green when the file is ready.',
    infoHow3:
      'Download the fixed file, or turn on automatic download to save it as soon as it is done.',
    infoNoteTitle: 'Good to know',
    infoNote1:
      'Not every broken PDF can be fixed. If the file is encrypted or badly damaged, the app will tell you.',
    infoNote2: 'Very large files may take a few seconds and use more memory.',
    infoNote3: 'The original file is never modified.',
    infoStoryTitle: 'Why I built this',
    infoStory:
      'My mom sings hymns in church and downloads the hymn PDFs from a website. She kept complaining that the files were corrupted. I looked into it, found the underlying issue, and built this tool to fix those files. I am sharing it here in case it helps anyone else with the same problem.',
    infoClose: 'Close',
    resultsTitle: 'Results',
    queue: '{count} in queue',
    recentTitle: 'Recent',
    historyNote: 'The last 5 files, kept for 30 days.',
    today: 'Today',
    yesterday: 'Yesterday',
    deleteAria: 'Delete',
    expiredButton: 'Expired',
    expiredTitle: 'File expired',
    expiredMessage:
      'Repairs are deleted after 30 days to free up space. Upload the original file again to repair it.',
    ok: 'OK',
    clearAria: 'Clear history',
    clearTitle: 'Clear history',
    clearMessage: 'Delete all recent files?',
    cancel: 'Cancel',
    confirmDelete: 'Delete',
    emptyHint: 'Your repaired files will appear here.',
    busy: 'In progress…',
    repairing: 'Repairing…',
    failed: 'Failed',
    clean: 'Good PDF',
    pages: '{count} pages',
    cleanNote: 'No problems found. The file was already fine.',
    ready: 'Ready',
    fixedOne: 'Fixed 1 structural problem in the PDF.',
    fixedMany: 'Fixed {count} structural problems in the PDF.',
    download: 'Download the repaired file',
    notPdf: 'This file is not a PDF (or it is encrypted).',
    error: 'Error: {msg}',
  },
} as const

export type StringKey = keyof (typeof strings)['el']

function detectLang(): Lang {
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language]
  if (preferred.some((lang) => lang.toLowerCase().startsWith('el'))) return 'el'
  try {
    if (Intl.DateTimeFormat().resolvedOptions().timeZone === 'Europe/Athens') return 'el'
  } catch {
    /* ignore */
  }
  return 'en'
}

let current: Lang = detectLang()
const listeners: Array<() => void> = []

try {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'el' || stored === 'en') current = stored
} catch {
  /* ignore */
}

export function getLang(): Lang {
  return current
}

export function t(key: StringKey, vars?: Record<string, string | number>): string {
  let out: string = strings[current][key]
  if (vars) {
    for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v))
  }
  return out
}

export function setLang(lang: Lang): void {
  if (lang === current) return
  current = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* ignore */
  }
  document.documentElement.lang = lang
  applyStatic()
  listeners.forEach((fn) => fn())
}

export function onLangChange(fn: () => void): () => void {
  listeners.push(fn)
  return () => {
    const index = listeners.indexOf(fn)
    if (index !== -1) listeners.splice(index, 1)
  }
}

export function applyStatic(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n as StringKey)
  })
  root.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria as StringKey))
  })
  document.title = t('docTitle')
}
