import { ArweaveExchangePrices } from "./exchange-prices";

const fs = require("fs");
const Arweave = require("arweave");
require("dotenv").config();
const arweave = Arweave.init({
  host: "arweave.net",
  port: 443,
  protocol: "https",
  timeout: 60000,
  logging: false,
});

const WALLET_PATH = process.env.WALLET_LOCATION;
if (!WALLET_PATH) throw new Error("WALLET_LOCATION not specified in .env");

const ORACLE_TAG = process.env.ARWEAVE_ORACLE_TAG;
if (!ORACLE_TAG) throw new Error("ARWEAVE_ORACLE_TAG not specified in .env");

const wallet = JSON.parse(fs.readFileSync(WALLET_PATH));

async function uploadNewPrices() {
  const arwevePrices = await ArweaveExchangePrices.fetchAggregatedData();

  const tx = await arweave.createTransaction(
    { data: JSON.stringify(arwevePrices) },
    wallet
  );
  tx.addTag("Content-Type", "application/json");
  tx.addTag("Secret", ORACLE_TAG);

  // Sign and deploy the secret file
  await arweave.transactions.sign(tx, wallet);
  await arweave.transactions.post(tx);

  await checkTxConfirmation(tx.id); // TODO think about multiple confimation checks
  console.log(`Deployed executable successfully with ID ${tx.id}`);
}

// timeout in ms
async function checkTxConfirmation(txId: string) {
  console.log(`TxId: ${txId}\nWaiting for confirmation`);
  const start = Date.now();
  for (;;) {
    const status = (await arweave.transactions.getStatus(txId)).status;
    switch (status) {
      case 202:
      case 404:
        break;
      case 200:
        console.log("Transaction found");
        return true;
      default:
        console.error(`Status ${status} while checking tx confirmation`);
        return false;
    }
    const elapsed = Date.now() - start;
    console.log(Math.round(elapsed / 60000) + "m waiting");
    await new Promise((resolve) => setTimeout(resolve, 60000));
  }
}

function main() {
  setInterval(() => uploadNewPrices(), 180000); // 180 000 - 3 minutes - avg Arweave block time
}

main();
