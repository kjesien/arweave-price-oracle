import axios from "axios";

enum CryptoExchange {
  binance = "binance",
  messari = "messari",
  coingecko = "coingecko",
}

type ArweaveAggregatePrices = Record<CryptoExchange, number>;

const ERROR_VALUE = -1;

export class ArweaveExchangePrices {
  private static exchangeWithPriceFetchMethod: {
    exchange: CryptoExchange;
    method: () => Promise<number>;
  }[] = [
    { exchange: CryptoExchange.coingecko, method: this.fetchCoinGeckoPrice },
    { exchange: CryptoExchange.binance, method: this.fetchBinancePrice },
    { exchange: CryptoExchange.messari, method: this.fetchMessariPrice },
  ];

  private static fetchCoinGeckoPrice(): Promise<number> {
    return axios
      .get("https://api.coingecko.com/api/v3/coins/arweave")
      .then((res) => res.data?.market_data.current_price.usd || ERROR_VALUE);
  }

  private static fetchBinancePrice(): Promise<number> {
    return axios
      .get<{
        mins: number;
        price: string;
      }>("https://api.binance.com/api/v3/ticker/price?symbol=ARUSDT")
      .then((res) => +res.data?.price || ERROR_VALUE);
  }

  private static fetchMessariPrice(): Promise<number> {
    return axios
      .get("https://data.messari.io/api/v1/assets/arweave/metrics/market-data")
      .then((res) => +res.data?.data.market_data.price_usd || ERROR_VALUE);
  }

  public static async fetchAggregatedData(): Promise<ArweaveAggregatePrices> {
    return Promise.all(
      this.exchangeWithPriceFetchMethod.map(({ exchange, method }) =>
        method()
          .then((price) => ({ exchange, price }))
          .catch(() => ({ exchange, price: ERROR_VALUE }))
      )
    ).then((exchengeWithPrice) =>
      exchengeWithPrice.reduce(
        (agg, { exchange, price }) => ({ ...agg, [exchange]: price }),
        {} as ArweaveAggregatePrices
      )
    );
  }
}
