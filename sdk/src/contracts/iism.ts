export interface IHypIsm {
  addr(): string;
}

export interface IHypIsmQuery {
  getSignerAddress(): Promise<string>;
}
