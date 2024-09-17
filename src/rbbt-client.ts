import { RBBTChannel } from "./rbbt-channel";
import { RBBTError } from "./rbbt-error";
import { Client } from "@stomp/stompjs";

export class RBBTClient {
  url: string;
  vhost: string;
  username: string;
  password: string;
  name?: string;
  channels: RBBTChannel[];
  closed = true;
  blocked?: string;
  channelMax = 0;
  frameMax?: number;
  heartbeat?: number = 5000;
  onerror?: (error: any) => void;
  public client: Client | null = null;

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
    this.channels = [];
  }

  connect() {
    const url = new URL(this.clone(this.url));
    const vhost = this.clone(this.vhost ? this.vhost : "/");
    const username = this.clone(this.username ? this.username : "guest");
    const password = this.clone(this.password ? this.password : "guest");
    const heartbeat = this.clone(this.heartbeat);

    if (!url.protocol.includes("ws")) {
      new RBBTError("Invalid protocol, use ws or wss", this);
    }

    // Connect to the amqp server
    this.connectToServer(url, vhost, username, password, heartbeat);
    return this;
  }

  private copyInto(obj: any, target: any) {
    var keys = Object.keys(obj);
    var i = keys.length;
    while (i--) {
      var k = keys[i];
      target[k] = obj[k];
    }
    return target;
  }

  private clone(obj: any) {
    return this.copyInto(obj, {});
  }

  private connectToServer(
    url: URL,
    vhost: string,
    username: string,
    password: string,
    heartbeat: number,
  ) {
    this.client = new Client({
      brokerURL: url.toString(),
      connectHeaders: {
        host: vhost,
        login: username,
        passcode: password,
      },
      heartbeatIncoming: heartbeat,
      heartbeatOutgoing: heartbeat,
    });

    this.client.activate();
    this.closed = false;
  }

  close() {
    if (this.client) {
      this.client.deactivate();
      this.closed = true;
    }
  }

  channel(id?: number) {
    if (this.closed) {
      new RBBTError("Client is closed", this);
    }

    if (id && id > 0) {
      const channel = this.channels[id];
      if (channel) return channel;
    }

    if (!id) id = this.channels.findIndex((ch) => ch === undefined);
    if (id === -1) id = this.channels.length;
    if (id > this.channelMax && this.channelMax > 0)
      new RBBTError("Max number of channels reached", this);

    const channel = new RBBTChannel(this, id);
    this.channels[id] = channel;
    return channel.open();
  }
}
