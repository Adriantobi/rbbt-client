import { RBBTError } from "./rbbt-error";
import { RBBTClient } from "./rbbt-client";
import { RBBTQueue } from "./rbbt-queue";
import { RBBTQueueParams } from "./types";

export class RBBTChannel {
  readonly connection: RBBTClient;
  readonly id: number;
  closed = false;

  constructor(connection: RBBTClient, id: number) {
    this.connection = connection;
    this.id = id;
  }

  open() {
    if (this.connection.client) {
      this.connection.client?.publish({
        destination: `/topic/${this.id}`,
        body: JSON.stringify({ type: "open" }),
      });

      this.connection.client?.subscribe(`/topic/${this.id}`, (msg) => {
        const data = JSON.parse(msg.body);
        if (data.type === "close") {
          this.closed = true;
        }
      });
    } else new RBBTError("Client not connected", this.connection);

    return this;
  }

  close() {
    this.connection.client?.publish({
      destination: `/topic/${this.id}`,
      body: JSON.stringify({ type: "close" }),
    });

    this.closed = true;
    this.connection.client?.unsubscribe(`/topic/${this.id}`);
    this.connection.channels = this.connection.channels.filter(
      (channel) => channel.id !== this.id,
    );

    return this;
  }

  queue(
    name = "",
    {
      passive = false,
      durable = name !== "",
      autoDelete = name === "",
      exclusive = name === "",
    } = {} as RBBTQueueParams,
    args = {},
  ) {
    return new RBBTQueue(this, name, {
      passive,
      durable,
      autoDelete,
      exclusive,
    });
  }
}
