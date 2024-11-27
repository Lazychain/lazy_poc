export interface IHypMailbox {
  addr: () => string;
}

export interface IHypMailboxQuery {
  status: () => void;
  defaultIsm: () => Promise<string>;
  localDomain: () => Promise<string>;
  recipientIsm: (recipient: string) => Promise<string>;
  messageDelivered: (messageId: string) => Promise<any>;
  hrp: () => Promise<any>;
  defaultHook: () => Promise<any>;
  requiredHook: () => Promise<any>;
  nonce: () => Promise<any>;
  latestDispathId: () => Promise<any>;
  quoteDispatch: (
    sender: string,
    recipientAddr: string,
    message: string,
    destDomain: number
  ) => Promise<any>;
}

export interface IHypMailboxExecute {
  setDefaultIsm(ism: string): any;
  dispatch(domain: number, recipientAddr: string, msg: string): any;
}
