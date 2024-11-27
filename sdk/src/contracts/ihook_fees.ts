export interface IHypHookFees {
  addr(): string;
}

export interface IHypHookFeesQuery {
  status(): Promise<void>;
  feeHookFees(): Promise<any>;
  feeHookMailbox(): Promise<any>;
  feeHookQuoteDispatch(metadata: string, message: string): Promise<any>;
}

export interface IHypHookFeesExecute {
  claim(recipient: string): Promise<any>;
  setFee(fee_denom: string, fee_amount: number): Promise<any>;
}
