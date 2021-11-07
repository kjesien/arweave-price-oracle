import Arweave from "arweave";
import { JWKInterface } from "arweave/node/lib/wallet";
import { ArweaveExchangePrices } from "./exchange-prices";

const MINUTE_IN_MS = 60000;

export async function uploadNewPrices(
  arweave: Arweave,
  wallet: JWKInterface,
  oracleTag: string
) {
  const arwevePrices = await ArweaveExchangePrices.fetchAggregatedData();

  const tx = await arweave.createTransaction(
    { data: JSON.stringify(arwevePrices) },
    wallet
  );
  tx.addTag("Content-Type", "application/json");
  tx.addTag("Secret", oracleTag);

  await arweave.transactions.sign(tx, wallet);
  await arweave.transactions.post(tx);

  await checkTxConfirmation(tx.id, arweave);
  console.log(
    `Uploaded aggregated Arweave Prices successfully with ID ${
      tx.id
    } at ${getNowIsoDate()}`
  );
}

function getNowIsoDate() {
  return new Date().toISOString();
}

// timeout in ms
async function checkTxConfirmation(
  txId: string,
  arweave: Arweave
): Promise<boolean> {
  console.log(`${getNowIsoDate()} TxId ${txId}: Waiting for confirmation`);
  const start = Date.now();
  for (;;) {
    const status = (await arweave.transactions.getStatus(txId)).status;
    switch (status) {
      case 202:
      case 404:
        break;
      case 200:
        console.log(`${getNowIsoDate()} TxId ${txId}: Transaction found`);
        return true;
      default:
        console.error(
          `${getNowIsoDate()} TxId ${txId}: Status ${status} while checking tx confirmation`
        );
        return false;
    }
    const elapsed = Date.now() - start;
    console.log(
      `${getNowIsoDate()} TxId ${txId}: ${Math.round(
        elapsed / MINUTE_IN_MS
      )}m waiting`
    );
    await new Promise((resolve) => setTimeout(resolve, MINUTE_IN_MS));
  }
}
