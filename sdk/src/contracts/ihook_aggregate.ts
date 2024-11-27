export interface IHypHookAggregate {
  addr(): string;
}

export interface IHypHookAggregateQuery {
  status(): Promise<void>;
  hooks(): Promise<any>;
  mailbox(): Promise<any>;
}

export interface IHypHookAggregateExecute {
  setHooks(hooks: string[]): Promise<any>;
}
