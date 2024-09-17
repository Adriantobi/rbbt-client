import type { RBBTClient } from "./rbbt-client";

export class RBBTError extends Error {
  connection: RBBTClient;

  constructor(message: string, connection: RBBTClient) {
    super(message);
    this.name = "RBBTError";
    this.connection = connection;
  }
}
