#!/usr/bin/env node
/**
 * Live, read-only integration checks for StandAlone Agent's Robinhood Chain features.
 * Run from the project root. Reads .env.local without printing secrets.
 * Requires Node 18+ (uses native fetch); no extra packages are needed.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env.local');
const ALCHEMY_BASE = 'https://robinhood-mainnet.g.alchemy.com/v2';
const BLOCKSCOUT_EXPLORER = 'https://robinhoodchain.blockscout.com';
const BLOCKSCOUT_API = 'https://api.blockscout.com/4663/api/v2';
const LOCAL_BASE = process.env.STANDALONE_BASE_URL || 'http://localhost:3000';
const EXPECTED_CHAIN_ID = 4663;
const EXPECTED_CHAIN_HEX = '0x1237';
const TIMEOUT_MS = 12000;
const results = [];

function parseEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '').trim();
    }
    out[match[1]] = value;
  }
  return out;
}

const envFile = parseEnvFile(ENV_PATH);
const apiKey = (process.env.ALCHEMY_ROBINHOOD_API_KEY || process.env.ALCHEMY_API_KEY || envFile.ALCHEMY_ROBINHOOD_API_KEY || envFile.ALCHEMY_API_KEY || '').trim();
const blockscoutKey = (process.env.BLOCKSCOUT_PRO_API_KEY || envFile.BLOCKSCOUT_PRO_API_KEY || '').trim();

function redactSecrets(value) {
  let out = String(value ?? '');
  if (apiKey) out = out.replaceAll(apiKey, '[ALCHEMY_KEY_REDACTED]');
  if (blockscoutKey) out = out.replaceAll(blockscoutKey, '[BLOCKSCOUT_KEY_REDACTED]');
  return out;
}

function report(name, status, detail = '') {
  results.push({ name, status, detail });
  const tag = status === 'PASS' ? '\u001b[32mPASS\u001b[0m' : status === 'FAIL' ? '\u001b[31mFAIL\u001b[0m' : '\u001b[33mSKIP\u001b[0m';
  console.log(`[${tag}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function fetchJson(url, init = {}) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  const text = await response.text();
  let payload;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text.slice(0, 240); }
  if (!response.ok) {
    const msg = payload && typeof payload === 'object' ? (payload.message || payload.error || payload.detail || payload.errors) : payload;
    const detail = typeof msg === 'string' ? msg : msg ? JSON.stringify(msg) : '';
    const safeDetail = redactSecrets(detail);
    throw new Error(`HTTP ${response.status}${safeDetail ? `: ${safeDetail.slice(0, 200)}` : ''}`);
  }
  return payload;
}

async function rpc(method, params = []) {
  const payload = await fetchJson(`${ALCHEMY_BASE}/${apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (payload?.error) throw new Error(`RPC ${payload.error.code ?? ''} ${payload.error.message ?? 'request failed'}`.trim());
  if (payload?.result === undefined) throw new Error('RPC response did not include result');
  return payload.result;
}

async function check(name, fn) {
  try {
    const detail = await fn();
    report(name, 'PASS', detail ?? 'response valid');
    return { ok: true, value: detail };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'request failed';
    report(name, 'FAIL', redactSecrets(message));
    return { ok: false, value: null };
  }
}

function asAddress(value) {
  if (typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value)) return value;
  if (value && typeof value === 'object') {
    const possible = value.hash || value.address_hash || value.address;
    if (typeof possible === 'string' && /^0x[a-fA-F0-9]{40}$/.test(possible)) return possible;
  }
  return null;
}

function asHash(value) {
  if (typeof value !== 'string') return null;
  return /^0x[a-fA-F0-9]{64}$/.test(value) ? value : null;
}

async function testLocalRoute(label, url, validate) {
  try {
    const payload = await fetchJson(url, { headers: { accept: 'application/json' } });
    const detail = validate(payload);
    report(label, 'PASS', detail || 'application endpoint responded');
    return payload;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'request failed';
    if (/fetch failed|ECONNREFUSED|ENOTFOUND|ECONNRESET|network/i.test(message)) {
      report(label, 'SKIP', 'local server unavailable; start pnpm dev in another terminal');
    } else {
      report(label, 'FAIL', message);
    }
    return null;
  }
}

console.log('\nStandAlone Agent — Robinhood Chain LIVE CHECK');
console.log('Read-only checks only. No wallet signing or transaction submission.');
console.log('Required keys: ALCHEMY_ROBINHOOD_API_KEY and BLOCKSCOUT_PRO_API_KEY (values hidden).');
console.log(`Project root: ${ROOT}`);
console.log(`.env.local found: ${fs.existsSync(ENV_PATH) ? 'yes' : 'no'}`);
console.log(`Alchemy key configured: ${apiKey ? 'yes (value hidden)' : 'no'}`);
console.log(`Blockscout PRO API key configured: ${blockscoutKey ? 'yes (value hidden)' : 'no'}`);
console.log(`Local app target: ${LOCAL_BASE}\n`);

let latestHash = null;
let sampleAddress = null;
let tokenAddress = null;

if (!apiKey) {
  report('Alchemy Robinhood Mainnet RPC', 'FAIL', 'add ALCHEMY_ROBINHOOD_API_KEY to .env.local; key value is never printed');
} else {
  const chain = await check('Alchemy eth_chainId', async () => {
    const value = await rpc('eth_chainId');
    if (String(value).toLowerCase() !== EXPECTED_CHAIN_HEX) throw new Error(`expected ${EXPECTED_CHAIN_HEX} (chain ID ${EXPECTED_CHAIN_ID}), received ${value}`);
    return `chain ID ${EXPECTED_CHAIN_ID} verified`;
  });
  await check('Alchemy eth_blockNumber', async () => {
    const value = await rpc('eth_blockNumber');
    if (!/^0x[0-9a-f]+$/i.test(value)) throw new Error('invalid block number format');
    return `latest block ${BigInt(value).toString(10)}`;
  });
  await check('Alchemy eth_gasPrice', async () => {
    const value = await rpc('eth_gasPrice');
    if (!/^0x[0-9a-f]+$/i.test(value)) throw new Error('invalid gas-price format');
    const gwei = Number(BigInt(value)) / 1e9;
    return `${gwei.toFixed(6)} Gwei`;
  });
  await check('Alchemy latest-block transaction count', async () => {
    const value = await rpc('eth_getBlockTransactionCountByNumber', ['latest']);
    if (!/^0x[0-9a-f]+$/i.test(value)) throw new Error('invalid transaction count format');
    return `${Number(BigInt(value))} transaction(s)`;
  });
  if (!chain.ok) report('Alchemy network identity', 'FAIL', 'provider did not confirm Robinhood Chain Mainnet');
}

let stats = null;
async function blockscoutFetch(path) {
  if (!blockscoutKey) throw new Error('missing BLOCKSCOUT_PRO_API_KEY; create a free key at https://dev.blockscout.com');
  return fetchJson(`${BLOCKSCOUT_API}${path}`, {
    headers: { accept: 'application/json', authorization: `Bearer ${blockscoutKey}` },
  });
}

if (!blockscoutKey) {
  report('Blockscout PRO API key', 'FAIL', 'add BLOCKSCOUT_PRO_API_KEY to .env.local; free key at https://dev.blockscout.com');
} else {
  await check('Blockscout PRO stats API', async () => {
    stats = await blockscoutFetch('/stats');
    if (!stats || typeof stats !== 'object') throw new Error('unexpected stats response');
    return 'PRO stats endpoint returned JSON';
  });

  let latest = null;
  await check('Blockscout PRO latest transactions API', async () => {
    latest = await blockscoutFetch('/transactions?filter=validated&items_count=1');
    const items = Array.isArray(latest?.items) ? latest.items : Array.isArray(latest) ? latest : [];
    if (!items.length) throw new Error('endpoint responded, but no transaction items were returned');
    const tx = items[0];
    latestHash = asHash(tx.hash || tx.transaction_hash);
    sampleAddress = asAddress(tx.from) || asAddress(tx.to);
    if (!latestHash) throw new Error('latest transaction did not include a valid hash');
    return `latest indexed transaction ${latestHash.slice(0, 10)}…`;
  });

  if (latestHash) {
    await check('Blockscout PRO transaction detail API', async () => {
      const tx = await blockscoutFetch(`/transactions/${latestHash}`);
      if (!tx || typeof tx !== 'object' || !(tx.hash || tx.transaction_hash)) throw new Error('unexpected transaction detail response');
      return 'transaction detail returned a hash';
    });
    await check('Blockscout PRO token-transfer API', async () => {
      const transfers = await blockscoutFetch(`/transactions/${latestHash}/token-transfers`);
      const items = Array.isArray(transfers?.items) ? transfers.items : Array.isArray(transfers) ? transfers : [];
      const first = items.find((item) => item && typeof item === 'object');
      if (!first) throw new Error('API responded, but sampled transaction has no indexed token transfers');
      const token = first.token && typeof first.token === 'object' ? first.token : null;
      tokenAddress = asAddress(token?.address) || asAddress(token?.address_hash) || asAddress(first.token_address);
      if (!tokenAddress) throw new Error('token transfer returned, but token address could not be normalized');
      return `token ${tokenAddress.slice(0, 10)}… found`;
    });
    if (tokenAddress) {
      await check('Blockscout PRO token detail API', async () => {
        const token = await blockscoutFetch(`/tokens/${tokenAddress}`);
        if (!token || typeof token !== 'object' || !(token.address || token.address_hash)) throw new Error('unexpected token detail response');
        return `token ${String(token.symbol || token.name || tokenAddress.slice(0, 10))} resolved`;
      });
    }
  }
  if (sampleAddress) {
    await check('Blockscout PRO address detail API', async () => {
      const address = await blockscoutFetch(`/addresses/${sampleAddress}`);
      if (!address || typeof address !== 'object' || !(address.hash || address.address_hash)) throw new Error('unexpected address response');
      return `address ${sampleAddress.slice(0, 10)}… resolved`;
    });
  }
}

await testLocalRoute('Local app Pulse route', `${LOCAL_BASE}/api/robinhood/pulse`, (payload) => {
  if (!payload?.ok || payload.data?.chainId !== EXPECTED_CHAIN_ID || payload.data?.networkMatches !== true) {
    throw new Error(payload?.error || `unexpected Pulse payload; chainId=${payload?.data?.chainId ?? 'missing'}`);
  }
  return `chain ${payload.data.chainId}; latest block ${payload.data.latestBlock}; ${payload.data.latencyMs} ms RPC latency`;
});

if (latestHash) {
  await testLocalRoute('Local app Explorer transaction route', `${LOCAL_BASE}/api/robinhood/explorer?kind=transaction&q=${latestHash}`, (payload) => {
    if (!payload?.ok || payload.data?.kind !== 'transaction') throw new Error(payload?.error || 'unexpected application response');
    return `transaction route returned ${String(payload.data.summary?.hash || latestHash).slice(0, 10)}…`;
  });
  if (sampleAddress) {
    await testLocalRoute('Local app Explorer address route', `${LOCAL_BASE}/api/robinhood/explorer?kind=address&q=${sampleAddress}`, (payload) => {
      if (!payload?.ok || payload.data?.kind !== 'address') throw new Error(payload?.error || 'unexpected application response');
      return 'address route returned normalized data';
    });
  }
  if (tokenAddress) {
    await testLocalRoute('Local app Explorer token route', `${LOCAL_BASE}/api/robinhood/explorer?kind=token&q=${tokenAddress}`, (payload) => {
      if (!payload?.ok || payload.data?.kind !== 'token') throw new Error(payload?.error || 'unexpected application response');
      return `token route returned ${String(payload.data.summary?.symbol || payload.data.summary?.name || tokenAddress.slice(0, 10))}`;
    });
  }
}

const pass = results.filter((r) => r.status === 'PASS').length;
const fail = results.filter((r) => r.status === 'FAIL').length;
const skip = results.filter((r) => r.status === 'SKIP').length;
console.log(`\nSummary: ${pass} PASS · ${fail} FAIL · ${skip} SKIP`);
if (fail > 0) {
  console.log('Fix FAIL results before treating the relevant live integration as verified.');
  process.exitCode = 1;
} else if (skip > 0) {
  console.log('Some checks were skipped; this is not a full live pass.');
  process.exitCode = 2;
} else {
  console.log('All executed live checks passed. This does not replace a full end-to-end browser test.');
}
