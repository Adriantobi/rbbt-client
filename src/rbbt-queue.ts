import { IMessage } from "@stomp/rx-stomp";
import { RBBTError } from "./rbbt-error";
import { RBBTExchange } from "./rbbt-exchange";
import { RBBTMessage } from "./rbbt-message";
import { RBBTConsumeParams, RBBTProperties, RBBTQueueParams } from "./types";

export class RBBTQueue {
  readonly exchange: RBBTExchange;
  readonly name: string;
  readonly passive: boolean;
  readonly durable: boolean;
  readonly autoDelete: boolean;
  readonly exclusive: boolean;
  private watch: any;
  private isBound: boolean = false;
  private routingKey: string = "";

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
    this.name = name === "" ? this.generateQueueName() : name;
    this.passive = passive;
    this.durable = durable;
    this.autoDelete = autoDelete;
    this.exclusive = exclusive;
    this.create();
  }

  private create() {
    if (
      this.exchange.connection.client &&
      this.exchange.connection.client?.active
    ) {
      if (this.exchange.closed === true)
        new RBBTError("Exchange is closed", this.exchange.connection);
      else {
        this.watch = this.exchange.connection.client
          .watch(`/queue/${this.name}`, {
            passive: this.passive as any,
            durable: this.durable as any,
            "auto-delete": this.autoDelete as any,
            exclusive: this.exclusive as any,
          })
          .subscribe((msg) => {
            const message = new RBBTMessage(this.exchange);
            if (msg.binaryBody) message.body = msg.binaryBody;
            else message.body = msg.body;
            message.properties = msg.headers;
          });
      }
    } else new RBBTError("Client not connected", this.exchange.connection);
  }

  bind(routingKey: string = "") {
    if (
      this.exchange.connection.client &&
      this.exchange.connection.client?.active
    ) {
      if (this.exchange.closed === true)
        new RBBTError("Exchange is closed", this.exchange.connection);
      else {
        this.isBound = true;
        this.routingKey = routingKey;
        this.watch.unsubscribe();
        this.watch = this.exchange.connection.client
          .watch(`/exchange/${this.exchange.name}/${routingKey}`, {
            "x-queue-name": `${this.name}`,
            exchange: this.exchange.name,
            routing_key: routingKey,
            passive: this.passive as any,
            durable: this.durable as any,
            "auto-delete": this.autoDelete as any,
            exclusive: this.exclusive as any,
          })
          .subscribe((msg) => {
            const message = new RBBTMessage(this.exchange);
            if (msg.binaryBody) message.body = msg.binaryBody;
            else message.body = msg.body;
            message.properties = msg.headers;
            return message;
          });
      }
    } else new RBBTError("Client not connected", this.exchange.connection);
  }

  unbind(routingKey: string = "") {
    if (
      this.exchange.connection.client &&
      this.exchange.connection.client?.active
    ) {
      if (this.exchange.closed === true)
        new RBBTError("Exchange is closed", this.exchange.connection);
      else {
        this.isBound = false;
        this.routingKey = "";
        this.watch.unsubscribe();
        this.watch = this.exchange.connection.client
          .watch(`/queue/${this.name}`, {
            "x-unbind": JSON.stringify({
              exchange: this.exchange.name,
              routing_key: routingKey,
            }),
            durable: this.durable as any,
            "auto-delete": this.autoDelete as any,
            exclusive: this.exclusive as any,
            passive: this.passive as any,
          })
          .subscribe((msg) => {
            const message = new RBBTMessage(this.exchange);
            if (msg.binaryBody) message.body = msg.binaryBody;
            else message.body = msg.body;
            message.properties = msg.headers;
            return message;
          });
      }
    } else new RBBTError("Client not connected", this.exchange.connection);
  }

  subscribe(
    {
      noAck = true,
      exclusive = false,
      tag = "",
      args = {},
    } = {} as RBBTConsumeParams,
    callback: (msg: RBBTMessage) => void,
  ) {
    if (
      this.exchange.connection.client &&
      this.exchange.connection.client?.active
    ) {
      if (this.exchange.closed === true)
        new RBBTError("Exchange is closed", this.exchange.connection);
      else {
        this.watch.unsubscribe();
        if (this.isBound) {
          this.watch.unsubscribe();
          this.watch = this.exchange.connection.client
            .watch(`/exchange/${this.exchange.name}/${this.routingKey}`, {
              "x-queue-name": `${this.name}`,
              exchange: this.exchange.name,
              routing_key: this.routingKey,
              passive: this.passive as any,
              durable: this.durable as any,
              "auto-delete": this.autoDelete as any,
              exclusive: this.exclusive as any,
              ack: noAck ? "client" : "client-individual",
            })
            .subscribe((msg) => {
              const message = this.createMessage(msg);
              callback(message);
              if (!noAck) msg.ack();
              // else msg.nack();
            });
        } else {
          this.watch = this.exchange.connection.client
            .watch(`/queue/${this.name}`, {
              exclusive: exclusive as any,
              passive: this.passive as any,
              durable: this.durable as any,
              "auto-delete": this.autoDelete as any,
              ack: noAck ? "client" : "client-individual",
            })
            .subscribe((msg) => {
              const message = this.createMessage(msg);
              callback(message);
              if (!noAck) msg.ack();
              // else msg.nack();
            });
        }
      }
    } else new RBBTError("Client not connected", this.exchange.connection);
  }

  unsubscribe() {
    this.watch.unsubscribe();
  }

  send(body: string | Uint8Array | undefined, properties: RBBTProperties = {}) {
    if (
      this.exchange.connection.client &&
      this.exchange.connection.client?.active
    ) {
      if (this.exchange.closed === true)
        new RBBTError("Exchange is closed", this.exchange.connection);
      else {
        const message: any = {
          destination: `/queue/${this.name}`,
          ...properties,
        };
        if (typeof body === "string") {
          message.body = body;
        } else if (body instanceof Uint8Array) {
          message.binaryBody = body;
        }
        this.exchange.connection.client.publish(message);
      }
    } else new RBBTError("Client not connected", this.exchange.connection);
  }

  private generateQueueName() {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+1234567890";
    let uniqueId = "";
    for (let i = 0; i < 22; i++) {
      uniqueId += chars[Math.floor(Math.random() * chars.length)];
    }
    return `rbbt.gen-${uniqueId}`;
  }

  private createMessage(msg: IMessage) {
    const message = new RBBTMessage(this.exchange);
    if (msg.binaryBody) message.body = msg.binaryBody;
    else message.body = msg.body;
    message.properties.messageId = msg.headers["message-id"];
    message.redelivered = msg.headers.redelivered === "true" ? true : false;
    message.bodySize = Number(msg.headers["content-length"]);
    if (msg.headers.destination.split("/").length > 2) {
      message.routingKey = msg.headers.destination.split("/")[2];
    }

    // Remove the headers that have been assigned to other properties
    delete msg.headers["message-id"];
    delete msg.headers.redelivered;
    delete msg.headers["content-length"];
    message.properties.headers = { ...msg.headers };

    return message;
  }
}
