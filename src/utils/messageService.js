import twilio from 'twilio';

// General sendMessage function. Uses Twilio if configured, otherwise falls back to console.log (dev).
export const sendMessage = async (to, body) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM || '+19034833219' ||  'US79b9718ef1c40aaddfeb045375fd0aaf';

  if (accountSid && authToken && from) {
    try {
      const client = twilio(accountSid, authToken);
      const msg = await client.messages.create({ body, from, to });
      console.log('SMS sent via Twilio:', msg.sid);
      return msg;
    } catch (err) {
      console.error('Twilio send error:', err);
      throw err;
    }
  }

  // Fallback for development/testing
  console.log(`sendMessage (fallback) -> to: ${to}, body: ${body}`);
  return { sid: 'dev-fallback', to, body };
};

// Send OTP message (simple text)
export const sendOTPMessage = async (phone, name, otp) => {
  const appName = process.env.APP_NAME || 'Mechanics App';
  const body = `Hello ${name || ''}, your ${appName} verification code is: ${otp}. It will expire in 10 minutes.`;
  return await sendMessage(phone, body);
};

export default {
  sendMessage,
  sendOTPMessage
};
