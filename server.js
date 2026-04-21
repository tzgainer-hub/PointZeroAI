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
// Assessment custom field IDs (created 2026-04-21 in sub-account Hu8eqsCdRaXeRd7PcnCy)
const GHL_FIELDS = {
  gap_count:    'sSoEtgILtlYsg2KGkbnr',
  top_gap:      'fiHi6VoEihasRTfAwsXR',
  industry:     'kp6VBvk4lCEukorX6whP',
  headline:     '4L6boKkM0nthdZevL7Pr',
  opps_html:    'NUWk6e3t5WXRfyoXMjQk',
  summary:      'OwbW5fr3DH5CppvEClc1',
  cta_sub:      'xwa2yCdGyq1yk40tS7VZ',
  hipaa_note:   'phx4iyLYCC6owmPcXSEo',
  details_html: 'v1Xy64Vb24ZHJqbbN585'
};

function createGhlContact({ email, firstName, lastName, phone, tags, customFields }) {
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
      tags: tags || [],
      customFields: customFields || []
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

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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
    const {
      email, gaps, top_gap, all_gaps, gaps_detail,
      industry, hours_lost, lead_response, follow_up, dormant_clients, reviews, goal, tasks,
      headline, summary, cta_sub, hipaa_note
    } = req.body;

    const goalStr = Array.isArray(goal) ? goal.join(', ') : (goal || '');
    const gapCount = gaps || 0;
    const gapList = Array.isArray(gaps_detail) ? gaps_detail : [];

    // Build opps_html (prospect email — the gap cards)
    let oppsHtml;
    if (gapList.length === 0) {
      oppsHtml = `<div style="padding:20px;background:#0f2547;border-left:4px solid #c9a447;border-radius:4px;margin:16px 0;">
        <div style="font-family:'Space Grotesk',sans-serif;font-size:1rem;font-weight:600;color:#fff;margin-bottom:8px;">No Major Gaps Detected</div>
        <div style="font-size:0.9rem;color:rgba(255,255,255,0.65);line-height:1.6;">Your business systems are ahead of most. The remaining opportunity is in optimization and scaling what's already working.</div>
      </div>`;
    } else {
      oppsHtml = gapList.map(g => {
        const sevColor = g.severity === 'high' ? '#c9a447' : 'rgba(255,255,255,0.12)';
        const sevTextColor = g.severity === 'high' ? '#1a1000' : 'rgba(255,255,255,0.7)';
        const sevLabel = g.severity === 'high' ? 'High Priority' : 'Moderate';
        return `<div style="padding:20px;background:#0f2547;border:1px solid rgba(201,164,71,0.15);border-radius:4px;margin:12px 0;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;">
            <span style="font-family:'Space Grotesk',sans-serif;font-size:1rem;font-weight:600;color:#fff;">${esc(g.title)}</span>
            <span style="background:${sevColor};color:${sevTextColor};font-size:0.65rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:3px 10px;border-radius:3px;">${sevLabel}</span>
          </div>
          <div style="font-size:0.88rem;color:rgba(255,255,255,0.65);line-height:1.6;margin-bottom:8px;">${esc(g.desc)}</div>
          <div style="font-size:0.85rem;color:#c9a447;line-height:1.5;">${esc(g.fix)}</div>
        </div>`;
      }).join('');
    }

    // Build details_html (Tom's notification — full answer dump)
    const detailsHtml = `<table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
      <tr><td style="padding:6px 0;color:#aab;width:140px;">Gaps Found</td><td style="padding:6px 0;font-weight:600;color:#c9a447;">${gapCount}</td></tr>
      <tr><td style="padding:6px 0;color:#aab;">Top Gap</td><td style="padding:6px 0;font-weight:600;">${esc(top_gap || 'None')}</td></tr>
      <tr><td style="padding:6px 0;color:#aab;">All Gaps</td><td style="padding:6px 0;">${esc(all_gaps || '—')}</td></tr>
      <tr><td style="padding:6px 0;color:#aab;">Industry</td><td style="padding:6px 0;">${esc(industry || '—')}</td></tr>
      <tr><td style="padding:6px 0;color:#aab;">Hours Lost/Wk</td><td style="padding:6px 0;">${esc(hours_lost || '—')}</td></tr>
      <tr><td style="padding:6px 0;color:#aab;">Lead Response</td><td style="padding:6px 0;">${esc(lead_response || '—')}</td></tr>
      <tr><td style="padding:6px 0;color:#aab;">Follow-Up</td><td style="padding:6px 0;">${esc(follow_up || '—')}</td></tr>
      <tr><td style="padding:6px 0;color:#aab;">Dormant Clients</td><td style="padding:6px 0;">${esc(dormant_clients || '—')}</td></tr>
      <tr><td style="padding:6px 0;color:#aab;">Reviews</td><td style="padding:6px 0;">${esc(reviews || '—')}</td></tr>
      <tr><td style="padding:6px 0;color:#aab;">Goals</td><td style="padding:6px 0;">${esc(goalStr || '—')}</td></tr>
      <tr><td style="padding:6px 0;color:#aab;">Tasks Eating Time</td><td style="padding:6px 0;">${esc(tasks || '—')}</td></tr>
    </table>`;

    await createGhlContact({
      email,
      tags: [
        'assessment',
        `gaps-${gapCount}`,
        industry ? industry.replace(/\s+/g, '-').toLowerCase() : 'other'
      ],
      customFields: [
        { id: GHL_FIELDS.gap_count,    field_value: String(gapCount) },
        { id: GHL_FIELDS.top_gap,      field_value: top_gap || 'None' },
        { id: GHL_FIELDS.industry,     field_value: industry || '' },
        { id: GHL_FIELDS.headline,     field_value: headline || '' },
        { id: GHL_FIELDS.opps_html,    field_value: oppsHtml },
        { id: GHL_FIELDS.summary,      field_value: summary || '' },
        { id: GHL_FIELDS.cta_sub,      field_value: cta_sub || '' },
        { id: GHL_FIELDS.hipaa_note,   field_value: hipaa_note
            ? `<div style="padding:16px 18px;background:rgba(255,255,255,0.03);border-left:3px solid rgba(201,164,71,0.35);border-radius:3px;margin-top:20px;font-size:0.85rem;color:rgba(255,255,255,0.65);line-height:1.6;">${esc(hipaa_note)}</div>`
            : '' },
        { id: GHL_FIELDS.details_html, field_value: detailsHtml }
      ]
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
