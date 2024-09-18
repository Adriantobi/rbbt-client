import { RBBTExchange } from "./rbbt-exchange";
import { RBBTError } from "./rbbt-error";
import { Client } from "@stomp/stompjs";
import { RBBTExchangeParams } from "./types";
import { RxStomp } from "@stomp/rx-stomp";

export class RBBTClient {
  url: string;
  vhost: string;
  username: string;
  password: string;
  name?: string;
  exchanges: RBBTExchange[];
  closed = true;
  blocked?: string;
  channelMax = 0;
  frameMax?: number;
  heartbeatIncoming?: number = 5000;
  heartbeatOutgoing?: number = 5000;
  onerror?: (error: any) => void;
  reconnectionDelay = 5000;
  debug: (msg: string) => void = () => {};
  public client: RxStomp | null = null;

  constructor(
    url: string,
    vhost: string,
    username: string,
    password: string,
    name?: string,
  ) {
    this.url = url;
    this.vhost = vhost;
    this.username = username;
    this.password = password;
    this.name = name;
    this.exchanges = [];
  }

  connect() {
    const url = this.clone(this.url);
    const vhost = this.clone(this.vhost ? this.vhost : "/");
    const username = this.clone(this.username ? this.username : "guest");
    const password = this.clone(this.password ? this.password : "guest");
    const heartbeatIncoming = this.clone(this.heartbeatIncoming);
    const heartbeatOutgoing = this.clone(this.heartbeatOutgoing);
    const reconnectionDelay = this.clone(this.reconnectionDelay);

    if (!url.split("://")[0].includes("ws")) {
      new RBBTError("Invalid protocol, use ws or wss", this);
    }

    // Connect to the amqp server
    this.connectToServer(
      url,
      vhost,
      username,
      password,
      heartbeatIncoming,
      heartbeatOutgoing,
      reconnectionDelay,
    );
    return this;
  }

  private clone(obj: any) {
    if (typeof obj === "string") return (" " + obj).slice(1);
    if (
      typeof obj === "number" ||
      typeof obj === "boolean" ||
      typeof obj === "undefined"
    )
      return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.slice(0);
    if (typeof obj === "object") return Object.assign({}, obj);
  }

  private connectToServer(
    url: string,
    vhost: string,
    username: string,
    password: string,
    heartbeatIncoming: number,
    heartbeatOutgoing: number,
    reconnectDelay: number,
  ) {
    this.client = new RxStomp(
      new Client({
        brokerURL: url,
        connectHeaders: {
          host: vhost,
          login: username,
          passcode: password,
        },
        heartbeatIncoming: heartbeatIncoming,
        heartbeatOutgoing: heartbeatOutgoing,
        reconnectDelay: reconnectDelay,
        debug: this.debug,
      }),
    );

    this.client.activate();
    this.closed = false;
  }

  close() {
    if (this.client) {
      this.client.deactivate();
      this.closed = true;
    }
  }

  exchange(name?: string, options = {} as RBBTExchangeParams) {
    if (this.closed) {
      new RBBTError("Client is closed", this);
    }

    if (name) {
      const exchange = this.exchanges.find((ch) => ch.name === name);
      if (exchange) return exchange;
    }

    if (!name)
      name = this.exchanges.findIndex((ch) => ch === undefined).toString();
    if (this.exchanges.length + 1 > this.channelMax && this.channelMax > 0)
      new RBBTError("Max number of channels reached", this);

    const exchange = new RBBTExchange(this, name, options);
    this.exchanges.push(exchange);
    return exchange;
  }
}
