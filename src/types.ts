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
  headers?: Record<string, any>;
  messageId?: string;
};

export type RBBTExchangeParams = {
  passive?: boolean;
  durable?: boolean;
  autoDelete?: boolean;
  internal?: boolean;
  args?: Record<string, any>;
};
