import amqp, { Connection, Channel, ConsumeMessage } from 'amqplib';
import { setupQueueWithDLQ } from './rabbitmq.utils.js';

interface RabbitConfig {
  url: string;
  serviceName: string;
}

export class RabbitMQ {
  private static connection: Awaited<ReturnType<typeof amqp.connect>> | null = null;
  private static channel: Channel | null = null;

  public static async connect(config: RabbitConfig) {
    if (this.connection) return;

    this.connection = await amqp.connect(config.url);
    this.channel = await this.connection.createChannel();

    console.log(`[RabbitMQ] ✅ Connected for ${config.serviceName}`);

    this.connection.on('close', () => {
      console.warn(`[RabbitMQ] ⚠️ Connection closed (${config.serviceName})`);
      this.connection = null;
      this.channel = null;
    });
  }

    public static getChannel(): Channel {
    if (!this.channel) throw new Error('RabbitMQ channel not initialized — call connect() first');
    return this.channel;
  }

 public static async bindQueueToExchanges(
  queueName: string,
  bindings: { exchange: string; routingKeys: string[] }[],
) {
  // Setup DLQ once
  const channel = this.getChannel();
  await setupQueueWithDLQ(channel, `${queueName}.retry.exchange`, queueName);

  for (const { exchange, routingKeys } of bindings) {
    for (const key of routingKeys) {
      await channel.bindQueue(queueName, exchange, key);
      console.log(`[RabbitMQ] 🔗 Bound ${queueName} → ${exchange} (${key})`);
    }
  }
}


  public static async setupExchange(exchange: string, type: 'topic' | 'direct' | 'fanout' = 'topic') {
    if (!this.channel) throw new Error('RabbitMQ not connected');
    await this.channel.assertExchange(exchange, type, { durable: true });
  }

  // public static async setupQueueWithRetry(exchange: string, queueName: string, routingKey: string) {
  //   if (!this.channel) throw new Error('RabbitMQ not connected');
  //   await setupQueueWithDLQ(this.channel, exchange, queueName, routingKey);
  // }

  public static async publish(exchange: string, routingKey: string, data: any) {
    if (!this.channel) throw new Error('RabbitMQ not connected');
    this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(data)), { persistent: true });
  }

  public static async consume(queue: string, handler: (data: any, msg: ConsumeMessage) => Promise<void> | void) {
    if (!this.channel) throw new Error('RabbitMQ not connected');
    await this.channel.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString());
        await handler(data, msg);
        this.channel!.ack(msg);
      } catch (err) {
        console.error(`[RabbitMQ] ❌ Handler error for ${queue}:`, err);
        this.channel!.nack(msg, false, false);
      }
    });
  }
}
