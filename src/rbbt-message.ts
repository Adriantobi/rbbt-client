import { RBBTChannel } from "./rbbt-channel";
import { RBBTProperties } from "./types";

export class RBBTMessage {
  channel: RBBTChannel;
  exchange: string = "";
  routingKey: string = "";
  properties: RBBTProperties = {};
  bodySize = 0;
  body: Uint8Array | null = null;
  bodyPos = 0;
  deliveryTag = 0;
  consumerTag = "";
  redelivered = false;
  messageCount?: number;
  replyCode?: number;
  replyText?: string;

  constructor(channel: RBBTChannel) {
    this.channel = channel;
  }
}
