import { GeminiService } from '../src/services/gemini.service';

async function runExample() {
  const proxyBase = 'http://localhost:4000';
  // This is the shared issuance token, used only to request a short-lived JWT from /issue-token
  const sharedIssuanceToken = 'issuetoken';

  const gs = new (GeminiService as any)();
  gs.setProxyConfig(proxyBase, sharedIssuanceToken);

  try {
    console.log('Requesting entity profile via proxy...');
    const profile = await gs.getEntityProfile('strong');
    console.log('Profile:', profile);
  } catch (err) {
    console.error('Proxy example error', err);
  }
}

runExample();
