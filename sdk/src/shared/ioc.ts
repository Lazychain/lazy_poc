import { Container } from "inversify";

import type { Config } from "./config";
import { Client } from "./config";
import { Context } from "./context";

export const CONTAINER = new Container({
  autoBindInjectable: true,
  defaultScope: "Singleton",
});

// referenced by tsoa
export const iocContainer = CONTAINER;

export class Dependencies {
  ctx: Context;
  client: Client;
  network: Config["networks"][number];

  constructor(
    ctx: Context,
    client: Client,
    network: Config["networks"][number]
  ) {
    this.ctx = ctx;
    this.client = client;
    this.network = network;
  }
}
