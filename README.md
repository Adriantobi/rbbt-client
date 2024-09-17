# RBBTClient

`RBBTClient` is a JavaScript library for interacting with RabbitMQ over WebSockets. It provides an easy-to-use API for connecting to RabbitMQ brokers, creating channels, and subscribing to queues.

## Installation

To install the `rbbt-client` package, use npm:

```bash
npm install rbbt-client
```

## Usage

Here's a basic example of how to use `RBBTClient`:

```javascript
import { RBBTClient } from "rbbt-client";
// Initialize the RBBTClient
const rbbt = new RBBTClient("ws://localhost:2400", "/", "guest", "guest");
// Connect to the RabbitMQ broker
const conn = rbbt.connect();
// Create a new channel
const channel = conn.channel();
// Create a new exclusive queue
const q = channel.queue("", { exclusive: true });
// Bind the queue to an exchange
q.bind("amq.direct", "test");
// Subscribe to the queue
q.subscribe({}, (msg) => {
  console.log(msg);
});
```

## API

### `RBBTClient`

- **Constructor**: `new RBBTClient(url, vhost, username, password)`
- `url`: The WebSocket URL of the RabbitMQ broker (e.g., `"amqp://localhost:2400"`).
- `vhost`: The virtual host to connect to (e.g., `"/"`). - `username`: The username for authentication (e.g., `"guest"`).
- `password`: The password for authentication (e.g., `"guest"`).
- **`connect()`**: Connects to the RabbitMQ broker and returns a connection object.

### Connection Object

- **`channel()`**: Creates and returns a new channel. ### Channel Object
- **`queue(name, options)`**: Creates and returns a new queue. - `name`: The name of the queue. - `options`: Options for the queue (e.g., `{ exclusive: true }`).
- **`bind(exchange, routingKey)`**: Binds the queue to an exchange.
- `exchange`: The name of the exchange.
- `routingKey`: The routing key for the binding.
- **`subscribe(options, callback)`**: Subscribes to messages from the queue.
- `options`: Options for subscription (e.g., `{}`).
- `callback`: A function to handle incoming messages.

## Example

Below is a full example demonstrating how to set up a connection, create a channel, declare a queue, bind it to an exchange, and start receiving messages:

```javascript
import { RBBTClient } from "rbbt-client";
const rbbt = new RBBTClient("amqp://localhost:2400", "/", "guest", "guest");
const conn = rbbt.connect();
const channel = conn.channel();
const q = channel.queue("", { exclusive: true });
q.bind("amq.direct", "test");
q.subscribe({}, (msg) => {
  console.log(msg);
});
```
