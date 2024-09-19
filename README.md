# RBBTClient

`RBBTClient` is a JavaScript library designed for seamless interaction with RabbitMQ over WebSockets. It offers a simple and intuitive API for connecting to RabbitMQ brokers, managing exchanges and subscribing to queues.

## Installation

To install the `rbbt-client` package, use npm:

```bash
npm install rbbt-client
```

## Usage

Here's a basic example of how to use `RBBTClient`:

```javascript
import { RBBTClient } from "rbbt-client";
// Initialize the RBBTClient: Stomp URL, vhost, username, password
const rbbt = new RBBTClient("ws://localhost:15674/ws", "/", "guest", "guest");
// The default stomp port is 15674, please don't make the same mistakes I made that lead to this package
// Connect to the RabbitMQ broker
const conn = rbbt.connect();
// Create a new channel
const ex = conn.exchange("amq.direct");
// Create a new exclusive queue
const q = ex.queue("", { exclusive: true });
// Bind the queue with a routing key
q.bind("test");
// Subscribe to the queue
q.subscribe({ noAck: true }, (msg) => {
  console.log(msg);
});
```

## API

### `RBBTClient`

#### Constructor: `new RBBTClient(url, vhost, username, password, name?)`

- **`url`**: The WebSocket URL of the RabbitMQ broker (e.g., `"ws://localhost:15674/ws"`).
- **`vhost`**: The virtual host to connect to (default: `"/"`).
- **`username`**: The username for authentication (default: `"guest"`).
- **`password`**: The password for authentication (default: `"guest"`).
- **`name?`**: Optional name for the client instance.

#### Methods

- **`connect()`**

  - Establishes a connection to the RabbitMQ broker using the provided credentials.
  - Returns the `RBBTClient` instance for chaining further calls.
  - Example:
    ```javascript
    const conn = rbbt.connect();
    ```

- **`close()`**

  - Closes the connection to the RabbitMQ broker.
  - Example:
    ```javascript
    conn.close();
    ```

- **`exchange(name, options)`**

  - Creates or retrieves an exchange by its `name`.
  - **Parameters**:
    - `name`: The name of the exchange. If omitted, an automatically generated name is used.
    - `options`: The exchange options (default: `{}`).
  - **Returns**: An `RBBTExchange` object.
  - Example:
    ```javascript
    const ex = conn.exchange("amq.direct");
    ```

- **`debug(msg)`**
  - A function that can be overridden to log debug messages.
  - Example:
    ```javascript
    conn.debug = (msg) => console.log(msg);
    ```

### `RBBTError`

#### Constructor: `new RBBTError(message, connection)`

- **`message`**: A string describing the error.
- **`connection`**: The `RBBTClient` instance that encountered the error.

`RBBTError` is a custom error class used throughout the `RBBTClient` library to handle client-specific errors.

#### Example:

```javascript
try {
  throw new RBBTError("Invalid connection", rbbt);
} catch (err) {
  console.error(err.message); // "Invalid connection"
}
```

### `RBBTExchange`

#### Constructor: `new RBBTExchange(connection, name, options)`

- **`connection`**: The `RBBTClient` instance associated with the exchange.
- **`name`**: The name of the exchange.
- **`options?`**: Optional parameters to configure the exchange (default: `{}`).

#### Methods

- **`queue(name, options)`**

  - Declares a queue in the current exchange.
  - **Parameters**:
    - `name`: The name of the queue (default: `""`).
    - `options`: Queue options (`durable`, `exclusive`, etc.).
  - **Returns**: An `RBBTQueue` object.
  - Example:
    ```javascript
    const q = ex.queue("", { exclusive: true });
    ```

- **`close()`**
  - Closes the exchange and unsubscribes from all queues.
  - Example:
    ```javascript
    ex.close();
    ```

### `RBBTMessage`

#### Constructor: `new RBBTMessage(exchange)`

- **`exchange`**: The `RBBTExchange` object associated with the message.

The `RBBTMessage` class represents a message sent or received from an exchange or queue. It contains properties and the message body.

#### Properties:

- **`exchange`**: The exchange where the message was published.
- **`routingKey`**: The routing key used for message delivery (default: `""`).
- **`properties`**: A collection of message properties (headers, delivery mode, etc.).
- **`bodySize`**: The size of the message body (default: `0`).
- **`body`**: The message content, which can be a `Uint8Array`, `string`, or `null`.
- **`bodyPos`**: The position in the message body (default: `0`).
- **`deliveryTag`**: The tag associated with the message delivery.
- **`consumerTag`**: The tag for the consumer receiving the message.
- **`redelivered`**: A flag indicating if the message was redelivered (default: `false`).
- **`messageCount?`**: The count of messages (optional).
- **`replyCode?`**: The reply code (optional).
- **`replyText?`**: The reply text (optional).

#### Example:

```javascript
const message = new RBBTMessage(exchange);
message.body = "Hello, world!";
console.log(message.body); // Output: "Hello, world!"
```

### `RBBTQueue`

#### Constructor: `new RBBTQueue(exchange, name, options)`

- **`exchange`**: The `RBBTExchange` instance that owns the queue.
- **`name`**: The name of the queue.
- **`options?`**: Configuration options like `durable`, `exclusive`, etc.

The `RBBTQueue` class represents a queue in RabbitMQ where messages are stored.

#### Methods:

- **`bind(routingKey)`**

  - Binds the queue to the exchange with a specific routing key.
  - **Parameters**:
    - `routingKey`: The routing key to bind (default: `""`).
  - Example:
    ```javascript
    queue.bind("my.routing.key");
    ```

- **`unbind(routingKey)`**

  - Unbinds the queue from the exchange with the given routing key.
  - **Parameters**:
    - `routingKey`: The routing key to unbind (default: `""`).
  - Example:
    ```javascript
    queue.unbind("my.routing.key");
    ```

- **`subscribe(options, callback)`**

  - Subscribes to the queue, receiving messages.
  - **Parameters**:
    - `options`: Subscription options like `noAck`, `exclusive`, etc.
    - `callback`: A function to handle incoming messages.
  - Example:
    ```javascript
    queue.subscribe({}, (msg) => {
      console.log(msg.body);
    });
    ```

- **`unsubscribe()`**
  - Unsubscribes from the queue.
  - Example:
    ```javascript
    queue.unsubscribe();
    ```

### Types

#### `RBBTQueueParams`

Defines the parameters for queue configuration.

- **`passive`**: (optional) If `true`, the queue must already exist (default: `false`).
- **`durable`**: (optional) If `true`, the queue will survive server restarts (default: `true` if `name` is provided, otherwise `false`).
- **`autoDelete`**: (optional) If `true`, the queue will automatically delete itself when no longer in use (default: `true` if `name` is not provided).
- **`exclusive`**: (optional) If `true`, the queue is exclusive to the connection (default: `true` if `name` is not provided).

```typescript
type RBBTQueueParams = {
  passive?: boolean;
  durable?: boolean;
  autoDelete?: boolean;
  exclusive?: boolean;
};
```

#### `RBBTConsumeParams`

Defines the parameters for consuming messages from a queue.

- **`tag`**: (optional) A consumer tag to identify the consumer.
- **`noAck`**: (optional) If `true`, messages are automatically acknowledged (default: `true`).
- **`exclusive`**: (optional) If `true`, the consumer is exclusive (default: `false`).
- **`args`**: (optional) Additional arguments for the consumer.

```typescript
export type RBBTConsumeParams = {
  tag?: string;
  noAck?: boolean;
  exclusive?: boolean;
  args?: Record<string, any>;
};
```

#### `RBBTProperties`

Defines the message properties that can be set on a published message.

- **`contentType`**: (optional) The MIME type of the message content.
- **`contentEncoding`**: (optional) The encoding used for the message.
- **`headers`**: (optional) Custom headers for the message, as key-value pairs.
- **`deliveryMode`**: (optional) Message delivery mode (persistent or transient).
- **`priority`**: (optional) Message priority.
- **`correlationId`**: (optional) Correlation ID used for RPC communication.
- **`replyTo`**: (optional) The name of the queue to which the recipient should reply.
- **`expiration`**: (optional) The expiration time for the message.
- **`messageId`**: (optional) The message identifier.
- **`timestamp`**: (optional) Timestamp when the message was created.
- **`type`**: (optional) The message type.
- **`userId`**: (optional) The user ID that published the message.
- **`appId`**: (optional) The application ID that published the message.
- **`clusterId`**: (optional) Cluster identifier for the message.

```typescript
export type RBBTProperties = {
  contentType?: string;
  contentEncoding?: string;
  headers?: Record<string, any>;
  deliveryMode?: number;
  priority?: number;
  correlationId?: string;
  replyTo?: string;
  expiration?: string;
  messageId?: string;
  timestamp?: number;
  type?: string;
  userId?: string;
  appId?: string;
  clusterId?: string;
};
```

#### `RBBTExchangeParams`

Defines the parameters for exchange configuration.

- **`passive`**: (optional) If `true`, the exchange must already exist (default: `false`).
- **`durable`**: (optional) If `true`, the exchange will survive server restarts (default: `false`).
- **`autoDelete`**: (optional) If `true`, the exchange will be deleted when no longer in use (default: `false`).
- **`internal`**: (optional) If `true`, the exchange is used only for internal message routing (default: `false`).
- **`args`**: (optional) Additional arguments for the exchange, passed as key-value pairs.

```typescript
export type RBBTExchangeParams = {
  passive?: boolean;
  durable?: boolean;
  autoDelete?: boolean;
  internal?: boolean;
  args?: Record<string, any>;
};
```

## Example

Below is a full example demonstrating how to set up a connection, create a channel, declare a queue, bind it to an exchange, and start receiving messages:

```typescript
import { RBBTClient } from "rbbt-client";

const rbbt = new RBBTClient("ws://localhost:15674/ws", "/", "guest", "guest");

// Step 2: Connect to RabbitMQ
const connection = rbbt.connect();

// Step 3: Create an exchange (this is where messages will be sent)
const exchange = connection.exchange("my.direct.exchange", {
  durable: true, // The exchange will survive server restarts
});

// Step 4: Create a queue (this is where messages will be received)
const queue = exchange.queue("my.queue", {
  durable: true, // The queue will survive server restarts
});

// Step 5: Bind the queue to the exchange using a routing key
queue.bind("my.routing.key");

// Step 6: Publish a message to the exchange
exchange.publish("my.routing.key", "Hello RabbitMQ!");

// Step 7: Subscribe to the queue to receive messages
queue.subscribe({}, (message) => {
  console.log("Received message:", message.body); // Display the message body in the console
});
```
