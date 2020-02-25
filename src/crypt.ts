import * as fs from "fs";
import * as crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

function encryptValue(value: string, key: Buffer): string {
  const nonce = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, nonce);
  const blocks = [nonce];
  blocks.push(cipher.update(value, "utf8"));
  blocks.push(cipher.final());
  const concat = Buffer.concat(blocks);
  return concat.toString("base64");
}

function decryptValue(value: string, key: Buffer): string {
  const concat = Buffer.from(value, "base64");
  const nonce = concat.slice(0, IV_LENGTH);
  const crypt = concat.slice(IV_LENGTH, concat.length);
  const cipher = crypto.createDecipheriv(ALGORITHM, key, nonce);
  const blocks = [];
  blocks.push(cipher.update(crypt, "binary", "utf8"));
  blocks.push(cipher.final("utf8"));
  return blocks.join("");
}

// read env file line by line, apply a transformation
// to every non-comment line and return result
function processEnvFile(filename: string, xform: (k: string, v: string) => string): string[] {
  return fs.readFileSync(filename, "utf-8").split("\n").map(line => {
    line = line.trim();
    if (line.length === 0 || line[0] === "#") return line;
    const results = /^([\w.-]+)\s*=\s*(.*)?\s*$/.exec(line);
    if (!results) throw new Error(`Couldn't parse line: ${line}`);
    const [, key, val] = results;
    if (val === undefined) return line;
    return key + "=" + xform(key, val);
  });
}

function passphraseToKey(passphrase: string): Buffer {
  return crypto.createHash("sha256").update(passphrase).digest();
}

interface Dictionary {
  [index: string]: string;
};

export function encryptFile(envFile: string, cryptFile: string, passphrase: string) {
  let oldDict: Dictionary = {};
  if (fs.existsSync(cryptFile))
    processEnvFile(cryptFile, (k, v) => oldDict[k] = v);

  const key = passphraseToKey(passphrase);
  const result = processEnvFile(envFile, (k, v) => {
    const old = oldDict[k];
    // preserve value in crypt file if it hasn't changed
    if (old && decryptValue(old, key) === v) return old;
    else return encryptValue(v, key);
  });

  fs.writeFileSync(cryptFile, result.join("\n"));
}

export function decryptFile(cryptFile: string, envFile: string, passphrase: string) {
  const key = passphraseToKey(passphrase);
  const result = processEnvFile(cryptFile, (k, v) => {
    const dec = decryptValue(v, key);
    if (!dec) throw new Error(`Couldn't decrypt line ${k}=${v}`);
    return dec;
  });
  fs.writeFileSync(envFile, result.join("\n"));
}
