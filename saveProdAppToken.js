
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Paste the FULL Production Application token:\n', (token) => {
  const clean = token.trim();

  if (clean.length < 100) {
    console.error('❌ Token too short — did not look valid.');
    rl.close();
    return;
  }

  const b64 = Buffer.from(clean, 'utf8').toString('base64');

  let env = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';

  if (/^EBAY_APP_ACCESS_TOKEN_B64_PROD=.*$/m.test(env)) {
    env = env.replace(
      /^EBAY_APP_ACCESS_TOKEN_B64_PROD=.*$/m,
      `EBAY_APP_ACCESS_TOKEN_B64_PROD=${b64}`
    );
  } else {
    env = env.trimEnd() + `\nEBAY_APP_ACCESS_TOKEN_B64_PROD=${b64}\n`;
  }

  fs.writeFileSync('.env', env, 'utf8');

  console.log('✅ Production token saved safely');
  console.log('TOKEN length:', clean.length, 'starts:', clean.slice(0, 10));

  rl.close();
});
