import { RBBTError } from "./rbbt-error";
import { RBBTExchange } from "./rbbt-exchange";
import { RBBTClient } from "./rbbt-client";
import { RBBTMessage } from "./rbbt-message";
import { RBBTConsumeParams, RBBTQueueParams } from "./types";

export class RBBTQueue {
  readonly channel: RBBTExchange;
  readonly name: string;
  readonly passive: boolean;
  readonly durable: boolean;
  readonly autoDelete: boolean;
  readonly exclusive: boolean;

  constructor(
    channel: RBBTExchange,
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
    return this.channel.connection.client?.subscribe(
      `/exchange/${exchange}/${routingKey}`,
      (msg) => {
        const message = new RBBTMessage(this.channel);
        if (msg.binaryBody) message.body = msg.binaryBody;
        else message.body = msg.body;
        message.properties = msg.headers;
      },
      {
        "x-queue-name": `${this.name}`,
        exchange,
        routing_key: routingKey,
      },
    );
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
      (msg) => {
        callback(msg);
        if (!noAck) msg.ack();
        else msg.nack();
      },
      {
        exclusive: exclusive as any,
      },
    );
  }

  unsubscribe() {
    return this.channel.connection.client?.unsubscribe(`/queue/${this.name}`);
  }
}
