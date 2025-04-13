"use client";

import * as React from "react";
import { RBBTClient } from "../rbbt-client";
import { RBBTQueue } from "../rbbt-queue";

export interface RBBTContextType {
  client: RBBTClient | undefined;
  connect: (() => void) | undefined;
  isConnected: boolean;
  createDisposableQueue: (
    exchange: string,
    routingKey: string,
  ) => RBBTQueue | undefined;
  connectToQueue: (
    exchange: string,
    queueName: string,
  ) => RBBTQueue | undefined;
}

export const RBBTContext = React.createContext<RBBTContextType>({
  client: undefined,
  connect: undefined,
  isConnected: false,
  createDisposableQueue: () => undefined,
  connectToQueue: () => undefined,
});
