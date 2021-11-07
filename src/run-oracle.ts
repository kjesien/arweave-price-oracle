import fs from "fs";
import Arweave from "arweave";
import dotenv from "dotenv";

import { uploadNewPrices } from "./upload-prices";

dotenv.config();

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

const UPLOAD_INTERVAL = process.env.UPLOAD_INTERVAL;
if (!UPLOAD_INTERVAL) throw new Error("UPLOAD_INTERVAL not specified in .env");

const wallet = JSON.parse(fs.readFileSync(WALLET_PATH!).toString());

async function main() {
  setInterval(
    () => uploadNewPrices(arweave, wallet, ORACLE_TAG as string),
    +UPLOAD_INTERVAL!
  );
}

main();
