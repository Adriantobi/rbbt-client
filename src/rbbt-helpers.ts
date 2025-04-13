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

  private convertMsg(msg: string | Uint8Array): string | JSON {
    if (msg instanceof Uint8Array) {
      const text = new TextDecoder().decode(msg);

      try {
        // First try to convert to JSON
        return JSON.parse(text);
      } catch {
        // If JSON parsing fails, return as string
        return text;
      }
    }

    return msg;
  }
}
