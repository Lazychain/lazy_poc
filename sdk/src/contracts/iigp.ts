export interface IHypIgp {
  addr(): string;
}

export interface IHypIgpQuery {
  status(): Promise<void>;
  ownable(): Promise<any>;
  routerDomains(): Promise<any>;
  routerListRoutes(): Promise<any>;
  mailbox(): Promise<any>;
  defaultGasPrice(): Promise<any>;
  listGasForDomains(): Promise<any>;
  beneficiary(): Promise<any>;
  quoteGasPayment(destination_domain: string, gas_amount: number): Promise<any>;
  gasForDomain(domains: string[]): Promise<any>;
  oracleExchangeRateAndGasPrice(destination_domain: number): Promise<any>;
}

export interface IHypIgpExecute {}
