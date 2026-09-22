# Invoice Generator

Single-page invoice app: build an invoice in the browser, download a sharp vector PDF,
or send it via WhatsApp / Email with the PDF attached. Stateless — nothing is stored
anywhere; each invoice is generated fresh from the form.

## Quick start

Double-click **`start.bat`**. It installs dependencies on first run, starts the server
hidden in the background, and opens `http://localhost:3000` in your browser.
Use **`stop.bat`** to stop the server.

Manual alternative:

```bat
npm install
node server.js
```

Requires Node.js 18+.

## Hosted vs opening the HTML file directly

**Recommended: via the server** (`start.bat` → `http://localhost:3000`). Everything works:
Download PDF, WhatsApp, default logo loads, and Email sends with the PDF attached
(requires `.env` SMTP setup).

**Fallback: double-clicking `index.html`** (opens as `file://`, no server). Works with limits:

| Feature | Via server | Direct `file://` |
| ------- | ---------- | ----------------- |
| Editor, totals, invoice ID | Yes | Yes |
| Download vector PDF | Yes | Yes |
| WhatsApp send | Yes | Yes |
| Default `logo.png` in PDF | Yes | No — it still shows in the editor, but browsers block local file reads so it can't embed into the PDF; upload a logo manually instead |
| Email with PDF attached | Yes | No — falls back to opening your mail app with the invoice text; download the PDF and attach it yourself |

Both modes work fully offline, except features that inherently need internet
(WhatsApp/Email sending). No data is stored in either mode.

## Email setup (for the Email button)

Copy `.env.example` to `.env` and fill in your SMTP credentials:

```bat
copy .env.example .env
```

For Gmail, create an **App Password** (Google Account → Security → 2-Step Verification →
App passwords) and use it as `SMTP_PASS`. Never commit `.env` — it is gitignored.

## Usage

- Fill in Bill To / Ship To, line items (material is a label only — pricing is manual),
  tax, discount, shipping, and amount paid.
- Invoice ID builds itself as `INV_CustomerName_Date`, e.g. `INV_Ravi_Kumar_2026-09-22`.
- **Download** — saves a vector PDF (crisp text, selectable, small file) with logo,
  item table, totals, and a UPI QR for the balance due.
- **WhatsApp** — opens a chat with the invoice summary (needs the customer number).
- **Email** — sends the invoice + PDF attachment via SMTP (needs `.env` + server running).
- Business details (name, phone, email, address, UPI ID) are saved as defaults in the
  browser only, under Invoice Settings.

## Project structure

| File | Purpose |
| ---- | ------- |
| `index.html` | The whole app: editor UI + vector-PDF builder (jsPDF) + QR (qrcodejs) |
| `server.js` | Static host + `/api/send-email` (nodemailer) + `/api/health` |
| `start.bat` / `stop.bat` | Background launch / stop on Windows |
| `.env.example` | Template for SMTP config (copy to `.env`) |
| `logo.png` | Default logo (click it in the app to replace) |
| `vendor/` | Local JS libraries: jsPDF 2.5.1 (PDF) + qrcodejs 1.0.0 (UPI QR) |

## Tech

Frontend: vanilla JS + jsPDF (vector PDF) + qrcodejs, bundled in `vendor/` (no CDN).
Backend: Node.js + Express + nodemailer. No database.
