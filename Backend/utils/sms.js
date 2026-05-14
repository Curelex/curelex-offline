const https = require('https');

/**
 * Send SMS via Fast2SMS (Quick SMS — no DLT needed for testing)
 *
 * Add this to your .env:
 *   FAST2SMS_API_KEY=your_api_key_here
 *   APP_BASE_URL=http://localhost:5173
 */

/**
 * sendTokenSMS — sends queue tracking SMS to patient
 * @param {string} phone  - 10-digit Indian mobile number
 * @param {object} data   - { tokenNumber, patientName, doctorName, clinicName, sessionToken }
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
async function sendTokenSMS(phone, data) {
  const { tokenNumber, patientName, doctorName, clinicName, sessionToken } = data;

  const baseUrl   = process.env.APP_BASE_URL || 'http://localhost:5173';
  const trackLink = `${baseUrl}/track/${sessionToken}`;
  const apiKey    = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  FAST2SMS_API_KEY not set — SMS skipped');
    return { success: false, error: 'FAST2SMS_API_KEY not configured' };
  }

  // Message text — keep under 160 chars for single SMS
  const message = `Dear ${patientName}, your token at ${clinicName} is #${tokenNumber} (Dr. ${doctorName}). Track live: ${trackLink}`;

  console.log(`📱 Sending SMS to ${phone}: ${message}`);

  // Fast2SMS Quick SMS API payload
  const payload = JSON.stringify({
    route:   'q',     // 'q' = Quick SMS (no DLT needed)
    numbers: phone,   // 10-digit number, no country code
    message: message,
    flash:   0,
    unicode: 0,
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'www.fast2sms.com',
      path:     '/dev/bulkV2',
      method:   'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type':  'application/json',
        'Cache-Control': 'no-cache',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          console.log('Fast2SMS response:', parsed);

          if (parsed.return === true) {
            console.log(`✅ SMS sent to ${phone} — Token #${tokenNumber}`);
            resolve({ success: true });
          } else {
            console.error('❌ Fast2SMS error:', parsed);
            resolve({ success: false, error: parsed.message || JSON.stringify(parsed) });
          }
        } catch (e) {
          console.error('❌ Parse error:', body);
          resolve({ success: false, error: body });
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ SMS request failed:', err.message);
      resolve({ success: false, error: err.message });
    });

    req.write(payload);
    req.end();
  });
}

module.exports = { sendTokenSMS };