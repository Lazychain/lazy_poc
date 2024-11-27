export interface IHypWarpNative {
  addr(): string;
}

export interface IHypWarpNativeQuery {
  status(): Promise<void>;
  tokenType(): Promise<any>;
  tokenMode(): Promise<any>;
  mailbox(): Promise<any>;
  hook(): Promise<any>;
  ism(): Promise<any>;
  domains(): Promise<any>;
  route(domain: number): Promise<any>;
  routes(): Promise<any>;
}

export interface IHypWarpNativeExecute {
  setInterchainSecurityModule(ismAddr: string): Promise<any>;
  setMailbox(mailboxAddr: string): Promise<any>;
  setHook(hookAddr: string): Promise<any>;
  setRoute(destination_domain: number, destination_route: string): Promise<any>;
  transfer(
    destination_domain: number,
    amount: number,
    fee: number
  ): Promise<any>;
  enrollRemoteRouter(
    destination_domain: number,
    destination_route: string
  ): Promise<any>;
}
