const express = require('express');
const path = require('path');
const https = require('https');
const app = express();

// ── RESEND HELPER ──
function sendResendEmail({ to, subject, html }) {
  return new Promise((resolve, reject) => {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) { console.log('RESEND_API_KEY missing'); resolve(); return; }

    const data = JSON.stringify({
      from: 'Point Zero AI <support@pointzeroai.com>',
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

// ── GHL HELPER ──
function createGhlContact({ email, firstName, lastName, phone, tags }) {
  return new Promise((resolve, reject) => {
    const token = process.env.GHL_API_TOKEN;
    const locationId = process.env.GHL_LOCATION_ID;
    if (!token || !locationId) { console.log('GHL env vars missing'); resolve(); return; }

    const data = JSON.stringify({
      locationId,
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      phone: phone || '',
      tags: tags || []
    });

    const options = {
      hostname: 'services.leadconnectorhq.com',
      path: '/contacts/upsert',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log('GHL status:', res.statusCode, body.slice(0, 300));
        resolve();
      });
    });
    req.on('error', (e) => { console.error('GHL error:', e); resolve(); });
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
app.get('/practice-audit', (req, res) => res.sendFile(path.join(__dirname, 'public', 'practice-audit.html')));

// ── ASSESSMENT SUBMIT ──
app.post('/api/submit-assessment', async (req, res) => {
  try {
    console.log('Assessment submission received:', req.body.email);
    const { email, gaps, top_gap, all_gaps, industry, hours_lost, lead_response, follow_up, dormant_clients, reviews, goal, tasks } = req.body;

    const goalStr = Array.isArray(goal) ? goal.join(', ') : (goal || '');

    await createGhlContact({
      email,
      tags: [
        'assessment',
        `gaps-${gaps || 0}`,
        industry ? industry.replace(/\s+/g, '-').toLowerCase() : 'other'
      ]
    });

    // ── NOTIFY TOM ──
    await sendResendEmail({
      to: 'tomz@pointzeroai.com',
      subject: `\uD83C\uDFAF New Assessment: ${email} \u2014 ${gaps || 0} gaps found \u2014 ${industry || 'Unknown'}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0c1e3c;color:#fff;padding:32px;border-radius:8px;">
          <h2 style="color:#c9a447;margin-top:0;">New Business Gap Assessment</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#aab;width:140px;">Email</td><td style="padding:8px 0;font-weight:600;">${email}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">Gaps Found</td><td style="padding:8px 0;font-weight:600;color:#c9a447;">${gaps || 0}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">Top Gap</td><td style="padding:8px 0;font-weight:600;">${top_gap || 'None'}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">All Gaps</td><td style="padding:8px 0;">${all_gaps || '\u2014'}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">Industry</td><td style="padding:8px 0;">${industry || '\u2014'}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">Hours Lost/Wk</td><td style="padding:8px 0;">${hours_lost || '\u2014'}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">Lead Response</td><td style="padding:8px 0;">${lead_response || '\u2014'}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">Follow-Up</td><td style="padding:8px 0;">${follow_up || '\u2014'}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">Dormant Clients</td><td style="padding:8px 0;">${dormant_clients || '\u2014'}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">Reviews</td><td style="padding:8px 0;">${reviews || '\u2014'}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">Goals</td><td style="padding:8px 0;">${goalStr || '\u2014'}</td></tr>
          </table>
          <div style="margin-top:24px;">
            <a href="https://calendly.com/tomz-pointzeroai/30min" style="background:#c9a447;color:#0c1e3c;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:700;">Schedule a Call</a>
          </div>
        </div>
      `
    });

    res.json({ ok: true });
  } catch(err) {
    console.error('Server error in submit-assessment:', err);
    res.json({ ok: true });
  }
});

// ── PRACTICE AUDIT SUBMIT ──
app.post('/api/submit-practice-audit', async (req, res) => {
  try {
    console.log('Practice audit submission received:', req.body.email);
    const {
      email, specialty, locations, providers, new_patients,
      inactive_patients, treatment_followup, noshow_rate,
      review_count, review_system, after_hours, reminder_system,
      website_age, website_booking,
      revenue_low, revenue_high,
      revenue_inactive, revenue_unsched, revenue_noshow, revenue_reputation
    } = req.body;

    const apiKey = process.env.MAILCHIMP_API_KEY;
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

    // Determine revenue tier tag
    let revTier = 'Rev-Under-50K';
    if (revenue_high >= 200000) revTier = 'Rev-Over-200K';
    else if (revenue_high >= 100000) revTier = 'Rev-100K-200K';
    else if (revenue_high >= 50000) revTier = 'Rev-50K-100K';

    const revenueStr = '$' + Math.round((revenue_low || 0) / 1000) + 'K-$' + Math.round((revenue_high || 0) / 1000) + 'K';

    if (apiKey && audienceId) {
      const dc = apiKey.split('-').pop();

      const data = JSON.stringify({
        email_address: email,
        status: 'subscribed',
        merge_fields: {
          SPECIALTY: specialty || '',
          REVENUE: revenueStr,
          LOCATIONS: locations || '',
          PROVIDERS: providers || '',
          NEWPATS: new_patients || '',
          NOSHOWRT: noshow_rate || '',
          REVIEWS: review_count || ''
        },
        tags: [
          'Practice-Audit',
          specialty ? specialty.replace(/\s+/g, '-').replace(/\//g, '-') : 'Other',
          revTier
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
        mcRes.on('end', () => {
          console.log('Mailchimp practice-audit status:', mcRes.statusCode);
        });
      });
      mcReq.on('error', (e) => console.error('Mailchimp practice-audit error:', e));
      mcReq.write(data);
      mcReq.end();
    }

    // ── NOTIFY TOM ──
    const fmtRange = (obj) => {
      if (!obj) return '$0';
      return '$' + Math.round((obj.low || 0) / 1000) + 'K-$' + Math.round((obj.high || 0) / 1000) + 'K';
    };

    await sendResendEmail({
      to: 'tomz@pointzeroai.com',
      subject: `\uD83C\uDFE5 Practice Audit: ${email} \u2014 ${specialty || 'Unknown'} \u2014 ${revenueStr}/yr`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0c1e3c;color:#fff;padding:32px;border-radius:8px;">
          <h2 style="color:#c9a447;margin-top:0;">New Practice Revenue Audit</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#aab;width:160px;">Email</td><td style="padding:8px 0;font-weight:600;">${email}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">Specialty</td><td style="padding:8px 0;">${specialty || '\u2014'}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">Locations</td><td style="padding:8px 0;">${locations || '\u2014'}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">Providers</td><td style="padding:8px 0;">${providers || '\u2014'}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">New Patients/Mo</td><td style="padding:8px 0;">${new_patients || '\u2014'}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">Inactive Patients</td><td style="padding:8px 0;">${inactive_patients || '\u2014'}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">Treatment Follow-Up</td><td style="padding:8px 0;">${treatment_followup || '\u2014'}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">No-Show Rate</td><td style="padding:8px 0;">${noshow_rate || '\u2014'}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">Google Reviews</td><td style="padding:8px 0;">${review_count || '\u2014'}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">Review System</td><td style="padding:8px 0;">${review_system || '\u2014'}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">After Hours</td><td style="padding:8px 0;">${after_hours || '\u2014'}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">Reminders</td><td style="padding:8px 0;">${reminder_system || '\u2014'}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">Website Age</td><td style="padding:8px 0;">${website_age || '\u2014'}</td></tr>
            <tr><td style="padding:8px 0;color:#aab;">Online Booking</td><td style="padding:8px 0;">${website_booking || '\u2014'}</td></tr>
          </table>
          <div style="margin-top:24px;padding:20px;background:rgba(201,164,71,0.1);border-left:4px solid #c9a447;">
            <h3 style="color:#c9a447;margin:0 0 12px 0;font-size:1rem;">Revenue Leakage: ${revenueStr}/year</h3>
            <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
              <tr><td style="padding:4px 0;color:#aab;">Inactive Patients</td><td style="padding:4px 0;color:#fff;">${fmtRange(revenue_inactive)}</td></tr>
              <tr><td style="padding:4px 0;color:#aab;">Unscheduled Treatment</td><td style="padding:4px 0;color:#fff;">${fmtRange(revenue_unsched)}</td></tr>
              <tr><td style="padding:4px 0;color:#aab;">No-Shows</td><td style="padding:4px 0;color:#fff;">${fmtRange(revenue_noshow)}</td></tr>
              <tr><td style="padding:4px 0;color:#aab;">Reputation Gap</td><td style="padding:4px 0;color:#fff;">${fmtRange(revenue_reputation)}</td></tr>
            </table>
          </div>
          <div style="margin-top:24px;">
            <a href="https://calendly.com/tomz-pointzeroai/30min" style="background:#c9a447;color:#0c1e3c;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:700;">Schedule a Call</a>
          </div>
        </div>
      `
    });

    res.json({ ok: true });
  } catch(err) {
    console.error('Server error in submit-practice-audit:', err);
    res.json({ ok: true });
  }
});

app.listen(PORT, () => console.log(`Point Zero AI running on port ${PORT}`));
