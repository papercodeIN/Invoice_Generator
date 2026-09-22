// Invoice backend (stateless: no invoice storage)
// Serves index.html + sends invoice emails via SMTP (Gmail). Run: npm install; npm start
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json({ limit: '15mb' })); // allows PDF attachment base64
app.use(express.static(__dirname));

/* ---------- SMTP email ---------- */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true', // false for port 587 (STARTTLS)
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function invoiceHtml(inv) {
  const rows = (inv.items || []).map((r, i) => {
    const qty = +r.qty || 0;
    const each = r.each!=null ? +r.each : ((+r.gram||0)*(+r.rate||0));
    const total = qty * each;
    return `<tr><td>${i + 1}</td><td><b>${esc(r.desc || 'Item')}</b><br><small>${esc(r.material || '')} • Qty ${qty} × ₹${each.toFixed(2)}</small></td>
      <td align="right">₹${total.toFixed(2)}</td></tr>`;
  }).join('');
  const b = inv.biz || {};
  return `<div style="font-family:Arial,sans-serif;max-width:600px">
    <h2 style="margin:0;color:#0f3d26">${esc(b.name || 'Invoice')}</h2>
    <p style="color:#555;margin:4px 0">${esc(b.phone || '')} • ${esc(b.email || '')}</p>
    <h3 style="color:#0f3d26">Invoice ${esc(inv.invNo)} — Balance Due ₹${(+inv.bal || 0).toFixed(2)}</h3>
    <p>Date: ${esc(inv.date || inv.invDate || '')}<br>
    <b>Bill To:</b> ${esc(inv.bill || '').replace(/\n/g,'<br>')}${inv.custPhone?' • '+esc(inv.custPhone):''}<br>
    ${inv.ship?'<b>Ship To:</b> '+esc(inv.ship).replace(/\n/g,'<br>')+'<br>':''}</p>
    <table width="100%" cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;word-break:break-word">
      <tr style="background:#0f3d26;color:#d3ecd8"><th>#</th><th align="left">Item</th><th align="right">Amount</th></tr>${rows}</table>
    <p align="right">Subtotal: ₹${(+inv.sub || 0).toFixed(2)}<br>Tax: ₹${(+inv.tax || 0).toFixed(2)}<br>
    <b>Total: ₹${(+inv.total || 0).toFixed(2)}</b><br>Paid: ₹${(+inv.paid || 0).toFixed(2)}<br>
    <b>Balance Due: ₹${(+inv.bal || 0).toFixed(2)}</b></p>
    <p>Pay via UPI: <b>${esc(b.upi || '')}</b><br>
    ${inv.notes||inv.note ? 'Note: ' + esc(inv.notes||inv.note) : ''}</p>
    <p style="color:#555">Thank you for your business!</p></div>`;
}

app.post('/api/send-email', async (req, res) => {
  try {
    const { to, invoice, pdfBase64, filename } = req.body || {};
    if (!to || !invoice) return res.status(400).json({ ok: false, error: 'need "to" and "invoice"' });
    const attachments = [];
    if (pdfBase64) attachments.push({ filename: filename || `${invoice.invNo || 'invoice'}.pdf`, content: pdfBase64, encoding: 'base64', contentType: 'application/pdf' });
    const notify = process.env.ORDER_NOTIFICATION_EMAIL;
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `Invoice Generator <${process.env.SMTP_USER}>`,
      to,
      bcc: notify && notify !== to ? notify : undefined, // owner gets a copy
      subject: `Invoice ${invoice.invNo} — Balance Due ₹${(+invoice.bal || 0).toFixed(2)}`,
      html: invoiceHtml(invoice),
      attachments,
    });
    res.json({ ok: true, messageId: info.messageId });
  } catch (e) {
    console.error('send-email failed:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/health', async (req, res) => {
  try { await transporter.verify(); res.json({ ok: true, smtp: 'ready' }); }
  catch (e) { res.json({ ok: false, smtp: e.message }); }
});

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Invoices: ${url}`);
  // Auto-launch in default browser (works no matter how the server was started).
  // Set NO_BROWSER=1 (or BROWSER=none) to skip.
  if (process.env.NO_BROWSER || String(process.env.BROWSER || '').toLowerCase() === 'none') return;
  const { exec } = require('child_process');
  const cmd = process.platform === 'win32' ? `start "" "${url}"`
    : process.platform === 'darwin' ? `open "${url}"`
    : `xdg-open "${url}"`;
  exec(cmd, (err) => { if (err) console.log('Open manually:', url); });
});
