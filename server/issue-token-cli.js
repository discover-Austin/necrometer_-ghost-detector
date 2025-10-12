#!/usr/bin/env node
const jwt = require('jsonwebtoken');
const fs = require('fs');

// Simple CLI to create a short-lived issuance token or a signed JWT for testing.
// Usage:
//  node issue-token-cli.js --type issuance --secret <secret>  => prints issuance bearer token
//  node issue-token-cli.js --type jwt --secret <secret> [--ttl 15m] => prints signed JWT

const argv = require('yargs/yargs')(process.argv.slice(2))
  .usage(`Usage: $0 --type [issuance|jwt] --secret <secret> [--ttl <ttl>]

Examples:
  $0 --type issuance --secret mysharedissuancetoken
  $0 --type jwt --secret myjwtsignsecret --ttl 15m`)
  .demandOption(['type','secret'])
  .string(['type','secret','ttl'])
  .alias('s','secret')
  .alias('t','type')
  .alias('l','ttl')
  .default('ttl','15m')
  .argv;

const type = argv.type;
const secret = argv.secret;
const ttl = argv.ttl;

if (type === 'issuance') {
  // For issuance tokens we just echo the shared token (it's used as a Bearer header by clients to call /issue-token)
  console.log(secret);
  process.exit(0);
}

if (type === 'jwt') {
  const payload = { iss: 'necrometer-proxy' };
  const token = jwt.sign(payload, secret, { expiresIn: ttl });
  console.log(token);
  process.exit(0);
}

console.error('Unknown type. Use --type issuance or --type jwt');
process.exit(2);
