export interface ITestRecipient {
  addr(): string;
}

export interface ITestRecipientExecute {
  setInterchainSecurityModule(ism: string): any;
}
