import { RBBTError } from "./rbbt-error";
import { RBBTChannel } from "./rbbt-channel";
import { RBBTClient } from "./rbbt-client";
import { RBBTMessage } from "./rbbt-message";
import { RBBTConsumeParams, RBBTQueueParams } from "./types";

export class RBBTQueue {
  readonly channel: RBBTChannel;
  readonly name: string;
  readonly passive: boolean;
  readonly durable: boolean;
  readonly autoDelete: boolean;
  readonly exclusive: boolean;

  constructor(
    channel: RBBTChannel,
    name: string,
    {
      passive = false,
      durable = name !== "",
      autoDelete = name === "",
      exclusive = name === "",
    } = {} as RBBTQueueParams,
  ) {
    this.channel = channel;
    this.name = name;
    this.passive = passive;
    this.durable = durable;
    this.autoDelete = autoDelete;
    this.exclusive = exclusive;
  }

  bind(exchange: string, routingKey: string) {
    return this.channel.connection.client?.publish({
      destination: `/exchange/${exchange}/${routingKey}`,
      body: JSON.stringify({ queue: this.name }),
      headers: {
        "x-bind": `/exchange/${exchange}/${routingKey}`,
      },
    });
  }

  subscribe(
    {
      noAck = true,
      exclusive = false,
      tag = "",
      args = {},
    } = {} as RBBTConsumeParams,
    callback: (msg: any) => void,
  ) {
    return this.channel.connection.client?.subscribe(
      `/queue/${this.name}`,
      callback,
    );
  }

  unsubscribe() {
    return this.channel.connection.client?.unsubscribe(`/queue/${this.name}`);
  }
}
