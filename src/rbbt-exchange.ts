import { RBBTError } from "./rbbt-error";
import { RBBTClient } from "./rbbt-client";
import { RBBTQueue } from "./rbbt-queue";
import { RBBTExchangeParams, RBBTQueueParams } from "./types";
import { RBBTMessage } from "./rbbt-message";

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
    this.name = name;
    this.options = options;
    this.queues = [];
    this.open();
  }

  private open() {
    if (this.connection.client && this.connection.client?.active) {
      try {
        this.watch = this.connection.client
          ?.watch(`/exchange/${this.name}`)
          .subscribe((msg) => {
            const message = new RBBTMessage(this);
            if (msg.binaryBody) message.body = msg.binaryBody;
            else message.body = msg.body;
            console.log(message);
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

  queue(
    name = "",
    {
      passive = false,
      durable = name !== "",
      autoDelete = name === "",
      exclusive = name === "",
    } = {} as RBBTQueueParams,
  ) {
    if (this.connection.closed) {
      new RBBTError("Exchange is closed", this.connection);
    }

    if (this.closed) {
      new RBBTError("Exchange is closed", this.connection);
    }

    if (name) {
      if (name === "") {
        const queue = new RBBTQueue(this, name, {
          passive,
          durable,
          autoDelete,
          exclusive,
        });
        this.queues.push(queue);
        return queue;
      }

      const queue = this.queues.find((q) => q.name === name);
      if (queue) return queue;
    }

    if (!name)
      name = this.queues.findIndex((ex) => ex === undefined).toString();

    const queue = new RBBTQueue(this, name, {
      passive,
      durable,
      autoDelete,
      exclusive,
    });
    this.queues.push(queue);
    return queue;
  }
}
