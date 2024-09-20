import { RBBTError } from "./rbbt-error";
import { RBBTClient } from "./rbbt-client";
import { RBBTQueue } from "./rbbt-queue";
import { RBBTExchangeParams, RBBTProperties, RBBTQueueParams } from "./types";
import { RBBTMessage } from "./rbbt-message";
import { IMessage } from "@stomp/rx-stomp";

export class RBBTExchange {
  readonly connection: RBBTClient;
  readonly name: string;
  private watch: any;
  queues: RBBTQueue[];
  closed = false;
  options: RBBTExchangeParams;

  constructor(
    connection: RBBTClient,
    name: string,
    options = {} as RBBTExchangeParams,
  ) {
    this.connection = connection;
    this.name = name === "" ? this.generateExchangeName() : name;
    this.options = options;
    this.queues = [];
    this.open();
  }

  private open() {
    if (this.connection.client && this.connection.client?.active) {
      try {
        this.watch = this.connection.client
          ?.watch(`/exchange/${this.name}`, {
            passive: this.options.passive as any,
            durable: this.options.durable as any,
            "auto-delete": this.options.autoDelete as any,
            internal: this.options.internal as any,
          })
          .subscribe((msg) => {
            const message = new RBBTMessage(this);
            if (msg.binaryBody) message.body = msg.binaryBody;
            else message.body = msg.body;
          });
      } catch (e) {
        new RBBTError(e as string, this.connection);
      }
    } else new RBBTError("Client not connected", this.connection);

    return this;
  }

  close() {
    this.watch.unsubscribe();
    this.closed = true;
    this.connection.exchanges = this.connection.exchanges.filter(
      (exchange) => exchange.name !== this.name,
    );
  }

  send(
    body: string | Uint8Array | undefined,
    routingKey: string,
    properties: RBBTProperties = {},
  ) {
    if (this.connection.client && this.connection.client?.active) {
      const message: any = {
        destination: `/exchange/${this.name}${routingKey && routingKey !== "" ? `/${routingKey}` : ""}`,
        ...properties,
      };
      if (typeof body === "string") {
        message.body = body;
      } else if (body instanceof Uint8Array) {
        message.binaryBody = body;
      }
      this.connection.client.publish(message);
    } else new RBBTError("Client not connected", this.connection);
  }

  subscribe(
    callback: (message: RBBTMessage) => void,
    { noAck = false, exclusive = false } = {} as {
      noAck?: boolean;
      exclusive?: boolean;
    },
  ) {
    if (this.connection.client && this.connection.client?.active) {
      if (this.closed === true)
        new RBBTError("Exchange is closed", this.connection);
      else {
        this.watch = this.connection.client
          .watch(`/exchange/${this.name}`, {
            exclusive: exclusive as any,
            passive: this.options.passive as any,
            durable: this.options.durable as any,
            internal: this.options.internal as any,
            "auto-delete": this.options.autoDelete as any,
            ack: noAck ? "client" : "client-individual",
          })
          .subscribe((msg) => {
            const message = this.createMessage(msg);
            callback(message);
            if (!noAck) msg.ack();
            // else msg.nack();
          });
      }
    } else new RBBTError("Client not connected", this.connection);
  }

  unsubscribe() {
    this.watch.unsubscribe();
  }

  queue(
    queueName = "",
    {
      passive = false,
      durable = queueName !== "",
      autoDelete = queueName === "",
      exclusive = queueName === "",
    } = {} as RBBTQueueParams,
  ) {
    if (this.connection.closed) {
      new RBBTError("Exchange is closed", this.connection);
    }

    if (this.closed) {
      new RBBTError("Exchange is closed", this.connection);
    }

    if (queueName) {
      const queue = this.queues.find((q) => q.name === queueName);
      if (queue) return queue;
    }

    const queue = new RBBTQueue(this, queueName, {
      passive,
      durable,
      autoDelete,
      exclusive,
    });
    this.queues.push(queue);
    return queue;
  }

  private generateExchangeName() {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+1234567890";
    let uniqueId = "";
    for (let i = 0; i < 10; i++) {
      uniqueId += chars[Math.floor(Math.random() * chars.length)];
    }
    return `rbbt.${uniqueId}`;
  }

  private createMessage(msg: IMessage) {
    const message = new RBBTMessage(this);
    if (msg.binaryBody) message.body = msg.binaryBody;
    else message.body = msg.body;
    message.properties.messageId = msg.headers["message-id"];
    message.redelivered = msg.headers.redelivered === "true" ? true : false;
    message.bodySize = Number(msg.headers["content-length"]);
    if (msg.headers.destination.split("/").length > 3) {
      message.routingKey = msg.headers.destination.split("/")[3];
    }

    // Remove the headers that have been assigned to other properties
    delete msg.headers["message-id"];
    delete msg.headers.redelivered;
    delete msg.headers["content-length"];
    message.properties.headers = { ...msg.headers };

    return message;
  }
}
