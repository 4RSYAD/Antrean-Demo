export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'ok',
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
    resendFromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  });
}
