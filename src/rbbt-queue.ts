import { RxStompRPC } from "@stomp/rx-stomp";
import { RBBTError } from "./rbbt-error";
import { RBBTExchange } from "./rbbt-exchange";
import { RBBTMessage } from "./rbbt-message";
import { RBBTConsumeParams, RBBTQueueParams } from "./types";

export class RBBTQueue {
  readonly exchange: RBBTExchange;
  readonly name: string;
  readonly passive: boolean;
  readonly durable: boolean;
  readonly autoDelete: boolean;
  readonly exclusive: boolean;
  private watch: any;
  private exchangeName: string = "";
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

  bind(exchange: string, routingKey: string = "") {
    if (
      this.exchange.connection.client &&
      this.exchange.connection.client?.active
    ) {
      if (this.exchange.closed === true)
        new RBBTError("Exchange is closed", this.exchange.connection);
      else {
        this.exchangeName = exchange;
        this.routingKey = routingKey;
        this.watch.unsubscribe();
        this.watch = this.exchange.connection.client
          .watch(`/exchange/${exchange}/bind-queue/${routingKey}`, {
            "x-queue-name": `${this.name}`,
            exchange: exchange,
            routing_key: routingKey,
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

  unbind(exchange: string, routingKey: string = "") {
    if (
      this.exchange.connection.client &&
      this.exchange.connection.client?.active
    ) {
      if (this.exchange.closed === true)
        new RBBTError("Exchange is closed", this.exchange.connection);
      else {
        this.exchangeName = "";
        this.routingKey = "";
        this.watch.unsubscribe();
        this.watch = this.exchange.connection.client
          .watch(`/queue/${this.name}`, {
            "x-unbind": JSON.stringify({
              exchange: exchange,
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
        if (this.exchangeName !== "") {
          this.watch.unsubscribe();
          this.watch = this.exchange.connection.client
            .watch(
              `/exchange/${this.exchangeName}/bind-queue/${this.routingKey}`,
              {
                "x-queue-name": `${this.name}`,
                exchange: this.exchangeName,
                routing_key: this.routingKey,
              },
            )
            .subscribe((msg) => {
              const message = new RBBTMessage(this.exchange);
              if (msg.binaryBody) message.body = msg.binaryBody;
              else message.body = msg.body;
              message.properties = msg.headers;
              callback(message);
              if (!noAck) msg.ack();
              else msg.nack();
            });
        } else {
          this.watch = this.exchange.connection.client
            .watch(`/queue/${this.name}`, {
              exclusive: exclusive as any,
              passive: this.passive as any,
              durable: this.durable as any,
              "auto-delete": this.autoDelete as any,
            })
            .subscribe((msg) => {
              const message = new RBBTMessage(this.exchange);
              if (msg.binaryBody) message.body = msg.binaryBody;
              else message.body = msg.body;
              message.properties = msg.headers;
              callback(message);
              if (!noAck) msg.ack();
              else msg.nack();
            });
        }
      }
    } else new RBBTError("Client not connected", this.exchange.connection);
  }

  unsubscribe() {
    this.watch.unsubscribe();
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
}
