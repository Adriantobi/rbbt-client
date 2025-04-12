"use client";

import * as React from "react";
import { RBBTContext, RBBTContextType } from "./rbbt-context";

export function useRBBT(): RBBTContextType {
  const {
    client,
    connect,
    isConnected,
    createDisposableQueue,
    connectToQueue,
    convertByteArrayToJSON,
    convertJSONToByteArray,
    convertByteArrayToString,
  } = React.useContext(RBBTContext);

  if (!client) {
    throw new Error("useRBBT must be used within a RBBTProvider");
  }

  return {
    client,
    connect,
    isConnected,
    createDisposableQueue,
    connectToQueue,
    convertByteArrayToJSON,
    convertJSONToByteArray,
    convertByteArrayToString,
  };
}
