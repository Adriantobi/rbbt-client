export type RBBTQueueParams = {
  passive?: boolean;
  durable?: boolean;
  autoDelete?: boolean;
  exclusive?: boolean;
};

export type RBBTConsumeParams = {
  tag?: string;
  noAck?: boolean;
  exclusive?: boolean;
  args?: Record<string, any>;
};

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

export type RBBTExchangeParams = {
  passive?: boolean;
  durable?: boolean;
  autoDelete?: boolean;
  internal?: boolean;
  args?: Record<string, any>;
};
