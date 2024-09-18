import { RBBTError } from "./rbbt-error";
import { RBBTExchange } from "./rbbt-exchange";
import { RBBTClient } from "./rbbt-client";
import { RBBTMessage } from "./rbbt-message";
import { RBBTConsumeParams, RBBTQueueParams } from "./types";

export class RBBTQueue {
  readonly exchange: RBBTExchange;
  readonly name: string;
  readonly passive: boolean;
  readonly durable: boolean;
  readonly autoDelete: boolean;
  readonly exclusive: boolean;

  constructor(
    exchange: RBBTExchange,
    name: string,
    {
      passive = false,
      durable = name !== "",
      autoDelete = name === "",
      exclusive = name === "",
    } = {} as RBBTQueueParams,
  ) {
    this.exchange = exchange;
    this.name = name;
    this.passive = passive;
    this.durable = durable;
    this.autoDelete = autoDelete;
    this.exclusive = exclusive;

    if (
      this.exchange.connection.client &&
      this.exchange.connection.client?.state === 0
    ) {
      if (this.exchange.closed === true)
        new RBBTError("Exchange is closed", this.exchange.connection);
      else {
        this.exchange.connection.client.onConnect = () => {
          this.exchange.connection.client?.subscribe(
            `/queue/${this.name}`,
            (msg) => {
              const message = new RBBTMessage(this.exchange);
              if (msg.binaryBody) message.body = msg.binaryBody;
              else message.body = msg.body;
              message.properties = msg.headers;
            },
            {
              exclusive: exclusive as any,
              passive: passive as any,
              durable: durable as any,
              auto_delete: autoDelete as any,
            },
          );
        };
      }
    } else new RBBTError("Client not connected", this.exchange.connection);
  }

  bind(exchange: string, routingKey: string) {
    if (
      this.exchange.connection.client &&
      this.exchange.connection.client?.state === 0
    ) {
      this.exchange.connection.client.onConnect = () => {
        this.exchange.connection.client?.subscribe(
          `/exchange/${exchange}/${routingKey}`,
          (msg) => {
            const message = new RBBTMessage(this.exchange);
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
      };
    } else new RBBTError("Client not connected", this.exchange.connection);
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
    if (
      this.exchange.connection.client &&
      this.exchange.connection.client?.state === 0
    ) {
      this.exchange.connection.client.onConnect = () => {
        this.exchange.connection.client?.subscribe(
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
      };
    } else new RBBTError("Client not connected", this.exchange.connection);
  }

  unsubscribe() {
    return this.exchange.connection.client?.unsubscribe(`/queue/${this.name}`);
  }
}
