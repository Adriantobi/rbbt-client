import { RBBTExchange } from "./rbbt-exchange";
import { RBBTProperties } from "./types";

export class RBBTMessage {
  channel: RBBTExchange;
  exchange: string = "";
  routingKey: string = "";
  properties: RBBTProperties = {};
  bodySize = 0;
  body: Uint8Array | string | null = null;
  bodyPos = 0;
  deliveryTag = 0;
  consumerTag = "";
  redelivered = false;
  messageCount?: number;
  replyCode?: number;
  replyText?: string;

  constructor(channel: RBBTExchange) {
    this.channel = channel;
  }
}
