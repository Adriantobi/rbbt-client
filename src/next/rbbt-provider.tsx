"use client";

import * as React from "react";
import { RBBTClient } from "../rbbt-client";
import { RBBTContext } from "./rbbt-context";

export interface RBBTProviderProps {
  children: React.ReactNode;
  config: {
    url: string;
    vhost: string;
    username: string;
    password: string;
  };
}

export const RBBTProvider = ({
  children,
  config: { url, vhost, username, password },
}: RBBTProviderProps) => {
  const [client, setClient] = React.useState<RBBTClient>();
  const [isConnected, setIsConnected] = React.useState(false);

  const connect = React.useCallback(() => {
    if (client) return;
    const rbbt = new RBBTClient(url, vhost, username, password);

    rbbt.reconnectionDelay = 1000;
    rbbt.connect();

    setClient(rbbt);
    setIsConnected(true);
  }, [url, client]);

  const createDisposableQueue = React.useCallback(
    (exchange: string, routingKey: string) => {
      if (!client) return undefined;
      try {
        const ex = client.exchange(exchange);
        const q = ex.queue();
        q.bind(routingKey);
        return q;
      } catch (e) {
        console.error(e);
        return undefined;
      }
    },
    [client],
  );

  const connectToQueue = React.useCallback(
    (exchange: string, queueName: string) => {
      if (!client) return undefined;
      try {
        const ex = client.exchange(exchange);
        const q = ex.queue(queueName);
        return q;
      } catch (e) {
        console.error(e);
        return undefined;
      }
    },
    [client],
  );

  const convertByteArrayToJSON = React.useCallback((byteArray: Uint8Array) => {
    try {
      const jsonString = new TextDecoder().decode(byteArray);
      return JSON.parse(jsonString);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, []);

  const convertJSONToByteArray = React.useCallback((json: any) => {
    try {
      const jsonString = JSON.stringify(json);
      return new TextEncoder().encode(jsonString);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, []);

  const convertByteArrayToString = React.useCallback(
    (byteArray: Uint8Array) => {
      try {
        return new TextDecoder().decode(byteArray);
      } catch (e) {
        console.error(e);
        return null;
      }
    },
    [],
  );

  React.useEffect(() => {
    connect();
    return () => {
      client?.close();
    };
  }, [connect, client]);

  if (!client) {
    return null;
  }

  const value = {
    client,
    connect,
    isConnected,
    createDisposableQueue,
    connectToQueue,
    convertByteArrayToJSON,
    convertJSONToByteArray,
    convertByteArrayToString,
  };

  return React.createElement(RBBTContext.Provider, { value }, children);
};
