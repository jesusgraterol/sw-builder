#! /usr/bin/env node
import process from 'node:process';
import { parseArgs } from 'argv-utils';
import { run } from './build/index.js';

(() => {
  try {
    run(parseArgs(process.argv));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
