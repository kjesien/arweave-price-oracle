import Arweave from "arweave";
import TestWeave from "testweave-sdk";

// init arweave as usual
const arweave = Arweave.init({
  host: "localhost",
  port: 1984,
  protocol: "http",
  timeout: 20000,
  logging: false,
});

// init TestWeave on the top of arweave
export default TestWeave.init(arweave);
