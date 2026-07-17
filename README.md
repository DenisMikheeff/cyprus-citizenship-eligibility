# Cyprus Citizenship Eligibility Calculator

A free, client-side calculator that estimates when someone may become eligible to apply for Cypriot citizenship by naturalization, based on physical presence, residence permit (ARC) history, and travel records.

**Live app:** https://denismikheeff.github.io/cyprus-citizenship-eligibility/

_Last updated: July 2026._

## What it does

- Lets you pick from four routes on the first screen: **Fast-track** (BCS / highly-skilled / Foreign Interest company), **Standard**, **Marriage to a Cypriot citizen**, and **M126** (registering a minor child as a Cypriot citizen) — M126 is informational only and shows its explanation inline on the same screen, without a separate step in the flow.
- Calculates the cumulative-years threshold, the final anniversary-year requirement, and the nearest date you could realistically apply — updating live as you add ARC dates, receipts, and travel history.
- Greek-language proficiency step offers the standard B1/A2 options plus the May 2024 exemption (Greek-taught school-leaving certificate or degree), available to both fast-track and standard applicants.
- Tracks a full travel log (arrivals/departures) and automatically surfaces trips taken after the cumulative threshold is reached — the table only populates once the threshold is actually met, with an option to add or edit trips manually.
- Includes a separate, free-form reference-dates table for anything else worth noting for your own records (e.g. when a residence permit was printed, or when your residence status changed) — never used in the eligibility calculation itself.
- Applies the BCS (Business of Collective Strategic companies / highly-skilled employment) concession on a rolling 365-day basis, not calendar years.
- Generates a print-ready PDF summary (English, Greek, or both) that mirrors the official "Detailed Record of Arrivals and Departures" format, with an optional custom note section (header + body) you can add to the export, and lets you download it at any point in the flow — every field is optional.
- Ships in three interface languages: English, Russian (Русский), and Greek (Ελληνικά).

## Important disclaimer

This tool provides an **informal, unofficial estimate only** — it is not legal advice. It does not account for "visa gaps" (illegal periods, or periods without a valid visa, residence permit, or visa-free passport) and was not designed for such cases, even where an immigration officer indicated informally that a gap "wasn't a problem" (e.g., during the COVID-19 pandemic). If any of this applies to you, or if your case involves back-and-forth status changes, please consult a licensed Cyprus immigration lawyer instead of relying on this or any other online calculator. This expanded warning is shown on the first screen; every other screen keeps a shorter reminder that this is an informal estimate, not legal advice.

**No backend, no database, no tracking.** Everything you type is processed entirely in your browser. Nothing is ever sent to a remote server. You can leave every field blank and still generate a PDF with blank space for handwritten entries.

## Tech stack

- [React](https://react.dev/) + [Vite](https://vitejs.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [react-i18next](https://react.i18next.com/) for EN / RU / EL localization
- [@react-pdf/renderer](https://react-pdf.org/) for client-side PDF generation
- [Vitest](https://vitest.dev/) for engine/unit tests

## Getting started

```bash
npm install
npm run dev       # start the local dev server
npm run build     # production build (outputs to dist/public)
npm run check     # TypeScript type-check
npm test          # run the test suite
```

## Deployment

Pushes to `main` automatically build and deploy to GitHub Pages via the workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

## License

Released under the [MIT License](LICENSE).
