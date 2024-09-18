import { RBBTError } from "./rbbt-error";
import { RBBTClient } from "./rbbt-client";
import { RBBTQueue } from "./rbbt-queue";
import { RBBTExchangeParams, RBBTQueueParams } from "./types";

export class RBBTExchange {
  readonly connection: RBBTClient;
  readonly name: string;
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
  }

  open() {
    if (this.connection.client && this.connection.client?.state === 0) {
      this.connection.client.onConnect = () => {
        this.connection.client?.publish({
          destination: `/${
            this.options?.type ? this.options.type : "topic"
          }/${this.name}`,
          body: JSON.stringify({ type: "open" }),
        });

        // this.connection.client?.subscribe(
        //   `/${this.options?.type ? this.options.type : "topic"}/${this.name}`,
        //   (msg) => {
        //     const data = JSON.parse(msg.body);
        //     if (data.type === "close") {
        //       this.closed = true;
        //     }
        //   },
        // );
      };
    } else new RBBTError("Client not connected", this.connection);

    return this;
  }

  close() {
    this.connection.client?.publish({
      destination: `/topic/${this.name}`,
      body: JSON.stringify({ type: "close" }),
    });

    this.closed = true;
    this.connection.client?.unsubscribe(`/topic/${this.name}`);
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
    return new RBBTQueue(this, name, {
      passive,
      durable,
      autoDelete,
      exclusive,
    });
  }
}
