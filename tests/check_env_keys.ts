const envKeys = Object.keys(process.env).filter(k => 
  k.includes('SUPABASE') || k.includes('TURNSTILE') || k.includes('CAPTCHA') || k.includes('CLOUDFLARE')
);
console.log('Relevant env keys present:', envKeys);
