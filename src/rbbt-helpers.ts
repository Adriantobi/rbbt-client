import { IMessage } from "@stomp/rx-stomp";
import { RBBTMessage } from "./rbbt-message";
import { RBBTExchange } from "./rbbt-exchange";

export class RBBTHelpers {
  public generateName(type: "Exchange" | "Queue") {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_1234567890.";
    let uniqueId = "";
    for (let i = 0; i < (type === "Exchange" ? 10 : 22); i++) {
      uniqueId += chars[Math.floor(Math.random() * chars.length)];
    }
    if (type === "Exchange") return `rbbt.${uniqueId}`;
    return `rbbt.gen-${uniqueId}`;
  }

  public createMessage(exchange: RBBTExchange, msg: IMessage) {
    const message = new RBBTMessage(exchange);
    if (msg.binaryBody) message.body = this.convertMsg(msg.binaryBody);
    else message.body = this.convertMsg(msg.body);
    message.properties.messageId = msg.headers["message-id"];
    message.redelivered = msg.headers.redelivered === "true" ? true : false;
    message.bodySize = Number(msg.headers["content-length"]);
    if (msg.headers.destination.split("/").length > 3) {
      message.routingKey = msg.headers.destination.split("/")[3];
    }

    // Remove the headers that have been assigned to other properties
    delete msg.headers["message-id"];
    delete msg.headers.redelivered;
    delete msg.headers["content-length"];
    message.properties.headers = { ...msg.headers };

    return message;
  }

  private convertMsg(
    msg: string | Uint8Array,
  ): string | number | boolean | object | Uint8Array {
    if (msg instanceof Uint8Array) {
      try {
        const text = new TextDecoder().decode(msg);

        try {
          return JSON.parse(text);
        } catch {
          // If it looks like text, return as string
          if (text.match(/^[\x20-\x7E\t\n\r]*$/)) {
            return text;
          }
        }

        // If we get here, it's either binary data or non-UTF8 text
        return msg; // Return original Uint8Array
      } catch {
        // If TextDecoder fails, it's definitely binary
        return msg; // Return original Uint8Array
      }
    }

    // Handle string input
    if (typeof msg === "string") {
      try {
        return JSON.parse(msg);
      } catch {
        return msg;
      }
    }

    return msg;
  }
}
