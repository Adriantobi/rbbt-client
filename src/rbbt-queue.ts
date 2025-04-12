import { RBBTError } from "./rbbt-error";
import { RBBTExchange } from "./rbbt-exchange";
import { RBBTMessage } from "./rbbt-message";
import { RBBTConsumeParams, RBBTProperties, RBBTQueueParams } from "./types";
import { RBBTHelpers } from "./rbbt-helpers";

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
  private helper: RBBTHelpers;

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
    this.helper = new RBBTHelpers();
    this.name = name === "" ? this.helper.generateName("Queue") : name;
    this.passive = passive;
    this.durable = durable;
    this.autoDelete = autoDelete;
    this.exclusive = exclusive || true;
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
            ...(this.passive && { passive: this.passive as any }),
            ...(this.durable && { durable: this.durable as any }),
            ...(this.autoDelete && { "auto-delete": this.autoDelete as any }),
            ...(this.exclusive && { exclusive: this.exclusive as any }),
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
            ...(this.passive && { passive: this.passive as any }),
            ...(this.durable && { durable: this.durable as any }),
            ...(this.autoDelete && { "auto-delete": this.autoDelete as any }),
            ...(this.exclusive && { exclusive: this.exclusive as any }),
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
            ...(this.passive && { passive: this.passive as any }),
            ...(this.durable && { durable: this.durable as any }),
            ...(this.autoDelete && { "auto-delete": this.autoDelete as any }),
            ...(this.exclusive && { exclusive: this.exclusive as any }),
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
      exclusive = true,
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
              ...(this.passive && { passive: this.passive as any }),
              ...(this.durable && { durable: this.durable as any }),
              ...(this.autoDelete && { "auto-delete": this.autoDelete as any }),
              ...(this.exclusive && { exclusive: this.exclusive as any }),
              ack: noAck ? "client" : "client-individual",
              ...(tag && { tag: tag }),
              ...args,
            })
            .subscribe((msg) => {
              const message = this.helper.createMessage(this.exchange, msg);
              callback(message);
              if (!noAck) msg.ack();
              // else msg.nack();
            });
        } else {
          this.watch = this.exchange.connection.client
            .watch(`/queue/${this.name}`, {
              ...(this.passive && { passive: this.passive as any }),
              ...(this.durable && { durable: this.durable as any }),
              ...(this.autoDelete && { "auto-delete": this.autoDelete as any }),
              ...(exclusive && { exclusive: exclusive as any }),
              ack: noAck ? "client" : "client-individual",
              ...(tag && { tag: tag }),
            })
            .subscribe((msg) => {
              const message = this.helper.createMessage(this.exchange, msg);
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
          message.body = body.replace(/\r/g, "");
        } else if (body instanceof Uint8Array) {
          message.binaryBody = body;
        } else {
          throw new RBBTError("Invalid message body", this.exchange.connection);
        }

        try {
          this.exchange.connection.client.publish(message);
        } catch {
          throw new RBBTError(
            "Failed to send message",
            this.exchange.connection,
          );
        }
      }
    } else new RBBTError("Client not connected", this.exchange.connection);
  }
}
