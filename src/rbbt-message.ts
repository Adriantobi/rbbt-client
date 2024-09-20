import { RBBTExchange } from "./rbbt-exchange";
import { RBBTProperties } from "./types";

export class RBBTMessage {
  exchange: RBBTExchange;
  routingKey: string = "";
  properties: RBBTProperties = {};
  bodySize = 0;
  body: Uint8Array | string | null = null;
  redelivered = false;

  constructor(exchange: RBBTExchange) {
    this.exchange = exchange;
  }
}
