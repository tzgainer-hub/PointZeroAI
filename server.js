const express = require('express');
const path = require('path');
const https = require('https');
const app = express();
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
    mcRes.on('end', () => {
      console.log('Mailchimp status:', mcRes.statusCode);
      console.log('Mailchimp response:', body);
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
