#!/usr/bin/env node

require('dotenv').config();
const { Command } = require('commander');
const axios = require('axios');

const program = new Command();
const API_KEY = process.env.KRIPICARD_API_KEY;
const BASE_URL = 'https://home.kripicard.com/api/premium';

program
  .name('card')
  .description('Full-featured Terminal CLI for Kripicard virtual card management')
  .version('1.0.0');

// 1. CREATE VIRTUAL CARD
program
  .command('create')
  .description('Issue a new virtual Visa card')
  .requiredOption('-f, --first <name>', 'First Name')
  .requiredOption('-l, --last <name>', 'Last Name')
  .requiredOption('-a, --amount <number>', 'Initial deposit in USD (Min 10)', parseFloat)
  .option('-b, --bin <number>', 'Bank BIN choice', '1')
  .action(async (opts) => {
    console.log(`\nExecuting automated card creation for ${opts.first} ${opts.last}...`);
    try {
      const res = await axios.post(`${BASE_URL}/Create_card`, {
        api_key: API_KEY,
        amount: opts.amount,
        bankBin: parseInt(opts.bin),
        first_name: opts.first,
        last_name: opts.last
      });
      console.log('\n================ CARD CREATED ================');
      console.log(JSON.stringify(res.data, null, 2));
      console.log('==============================================\n');
    } catch (err) {
      console.error(`\nAPI Error: ${err.response?.data?.message || err.message}`);
    }
  });

// 2. FUND / TOP UP CARD
program
  .command('fund')
  .description('Top up an active virtual card')
  .requiredOption('-i, --id <cardId>', 'Card ID')
  .requiredOption('-a, --amount <number>', 'Top-up amount in USD (Min 10)', parseFloat)
  .action(async (opts) => {
    console.log(`\nExecuting top-up for Card ID: ${opts.id}...`);
    try {
      const res = await axios.post(`${BASE_URL}/Fund_Card`, {
        api_key: API_KEY,
        card_id: opts.id,
        amount: opts.amount
      });
      console.log('\n================ CARD FUNDED =================');
      console.log(JSON.stringify(res.data, null, 2));
      console.log('==============================================\n');
    } catch (err) {
      console.error(`\nAPI Error: ${err.response?.data?.message || err.message}`);
    }
  });

// 3. GET CARD DETAILS
program
  .command('details')
  .description('Fetch card credentials and history')
  .requiredOption('-i, --id <cardId>', 'Card ID')
  .action(async (opts) => {
    console.log(`\nRetrieving credentials for Card ID: ${opts.id}...`);
    try {
      const res = await axios.post(`${BASE_URL}/Get_CardDetails`, {
        api_key: API_KEY,
        card_id: opts.id
      });
      console.log('\n================ CARD DETAILS ================');
      console.log(JSON.stringify(res.data, null, 2));
      console.log('==============================================\n');
    } catch (err) {
      console.error(`\nAPI Error: ${err.response?.data?.message || err.message}`);
    }
  });

// 4. FREEZE / UNFREEZE
program
  .command('freeze')
  .description('Freeze or unfreeze a virtual card')
  .requiredOption('-i, --id <cardId>', 'Card ID')
  .requiredOption('-act, --action <state>', 'Action: "freeze" or "unfreeze"')
  .action(async (opts) => {
    console.log(`\nSetting freeze status for Card ID ${opts.id} to [${opts.action}]...`);
    try {
      const res = await axios.post(`${BASE_URL}/Freeze_Unfreeze`, {
        api_key: API_KEY,
        card_id: opts.id,
        action: opts.action
      });
      console.log('\n================ STATUS UPDATED ================');
      console.log(JSON.stringify(res.data, null, 2));
      console.log('================================================\n');
    } catch (err) {
      console.error(`\nAPI Error: ${err.response?.data?.message || err.message}`);
    }
  });

program.parse(process.argv);
