#!/usr/bin/env node

import * as readline from "readline";
import { question } from "readline-sync";
import { encryptFile, decryptFile } from "./crypt";

const argv = process.argv.slice(2);
if (["e", "encrypt"].includes(argv[0]) && argv.length === 2) {
  readPassword()
    .then(pass => encryptFile(".env", argv[1], pass))
    .catch(handleError);
} else if (["d", "decrypt"].includes(argv[0]) && argv.length === 2) {
  readPassword()
    .then(pass => decryptFile(argv[1], ".env", pass))
    .catch(handleError);
} else {
  help();
  process.exit(1);
}

function help() {
  console.log(`
envgineer: Pragmatic secrets management via encrypted .env files

Usage: envgineer e/encrypt <crypt>      encrypts .env to <crypt>
       envgineer d/decrypt <crypt>      decrypts <crypt> to .env

The passphrase will be read from the terminal or can be piped to
envgineer if used in a script: echo secret123 | envgineer ...

If upon encryption the target cryptfile already exists, unchanged
encrypted entries will be preserved to allow for simple auditing
e.g. using git diff.
`);
}

function handleError(error: Error) {
  console.error(error.message);
  process.exit(1);
}

function readPassword(): Promise<string> {
  return new Promise<string>(resolve => {
    if (process.stdin.isTTY) {
      resolve(question("Password: ", { hideEchoBack: true }));
    } else {
      readline
        .createInterface({ input: process.stdin })
        .on("line", pass => resolve(pass));
    }
  });
}
