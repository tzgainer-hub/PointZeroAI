const express = require('express');
const path = require('path');
const https = require('https');
const app = express();

// ── RESEND HELPER ──
function sendResendEmail({ to, subject, html }) {
  return new Promise((resolve, reject) => {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) { resolve(); return; }

    const data = JSON.stringify({
      from: 'Point Zero AI <onboarding@pointzeroai.com>',
      to: [to],
      subject,
      html
    });

    const options = {
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log('Resend status:', res.statusCode, body);
        resolve();
      });
    });
    req.on('error', (e) => { console.error('Resend error:', e); resolve(); });
    req.write(data);
    req.end();
  });
}
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'public', 'privacy.html')));
app.get('/support', (req, res) => res.sendFile(path.join(__dirname, 'public', 'support.html')));
app.get('/masterclass', (req, res) => res.sendFile(path.join(__dirname, 'public', 'masterclass.html')));
app.get('/ai-business-stack', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ai-business-stack.html')));
app.get('/assessment', (req, res) => res.sendFile(path.join(__dirname, 'public', 'assessment.html')));

// ── MAILCHIMP SUBMIT ──
app.post('/api/submit-assessment', async (req, res) => {
  try {
    console.log('Assessment submission received:', req.body.email);
    const { email, score, level, industry, hours_lost, ai_usage, goal, tasks } = req.body;

    const apiKey = process.env.MAILCHIMP_API_KEY;
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

    if (!apiKey || !audienceId) {
      return res.json({ ok: true });
    }

    // Normalize arrays to strings
    const goalStr = Array.isArray(goal) ? goal.join(', ') : (goal || '');
    const tasksStr = Array.isArray(tasks) ? tasks.join(', ') : (tasks || '');

    // Extract datacenter from API key (e.g. "abc123-us1" → "us1")
    const dc = apiKey.split('-').pop();

    const data = JSON.stringify({
      email_address: email,
      status: 'subscribed',
      merge_fields: {
        SCORE: String(score || ''),
        LEVEL: String(level || ''),
        INDUSTRY: industry || '',
        HOURS: hours_lost || '',
        AIUSAGE: ai_usage || '',
        GOAL: goalStr
      },
    tags: [
      'Assessment',
      `Level-${level}`,
      industry ? industry.replace(/\s+/g, '-') : 'Other'
    ]
  });

  const options = {
    hostname: `${dc}.api.mailchimp.com`,
    path: `/3.0/lists/${audienceId}/members`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const mcReq = https.request(options, (mcRes) => {
    let body = '';
    mcRes.on('data', chunk => body += chunk);
    mcRes.on('end', async () => {
      console.log('Mailchimp status:', mcRes.statusCode);
      console.log('Mailchimp response:', body);

      // ── NOTIFY TOM ──
      const levelLabels = { 1: 'AI Observer', 2: 'AI Explorer', 3: 'AI Adopter', 4: 'AI Integrator', 5: 'AI Transformer' };
      const levelLabel = levelLabels[level] || `Level ${level}`;
      await sendResendEmail({
        to: 'tomz@pointzeroai.com',
        subject: `🎯 New Assessment: ${email} — ${levelLabel} (${score}/100)`,
        html: `
          <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0c1e3c;color:#fff;padding:32px;border-radius:8px;">
            <h2 style="color:#c9a447;margin-top:0;">New Assessment Completed</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#aab;width:140px;">Email</td><td style="padding:8px 0;font-weight:600;">${email}</td></tr>
              <tr><td style="padding:8px 0;color:#aab;">Score</td><td style="padding:8px 0;font-weight:600;">${score}/100</td></tr>
              <tr><td style="padding:8px 0;color:#aab;">Level</td><td style="padding:8px 0;font-weight:600;">${levelLabel}</td></tr>
              <tr><td style="padding:8px 0;color:#aab;">Industry</td><td style="padding:8px 0;">${industry || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#aab;">Hours Lost/Wk</td><td style="padding:8px 0;">${hours_lost || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#aab;">AI Usage</td><td style="padding:8px 0;">${ai_usage || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#aab;">Goals</td><td style="padding:8px 0;">${goalStr || '—'}</td></tr>
            </table>
            <div style="margin-top:24px;">
              <a href="https://calendly.com/tomz-pointzeroai/30min" style="background:#c9a447;color:#0c1e3c;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:700;">Schedule a Call</a>
            </div>
          </div>
        `
      });

      if (mcRes.statusCode === 400 && body.includes('already a list member')) {
        return res.json({ ok: true });
      }
      res.json({ ok: true });
    });
  });

  mcReq.on('error', (e) => {
    console.error('Mailchimp request error:', e);
    res.json({ ok: true });
  });

  mcReq.write(data);
  mcReq.end();

  } catch(err) {
    console.error('Server error in submit-assessment:', err);
    res.json({ ok: true });
  }
});

app.listen(PORT, () => console.log(`Point Zero AI running on port ${PORT}`));
