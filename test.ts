import { RBBTClient } from "./src/rbbt-client";

const rbbt = new RBBTClient("amqp://localhost:2400", "/", "guest", "guest");
const conn = rbbt.connect();
const channel = conn.channel();
const q = channel.queue("", { exclusive: true });
q.bind("amq.direct", "test");
q.subscribe({}, (msg) => {
  console.log(msg);
});
