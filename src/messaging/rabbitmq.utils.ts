import { Channel } from 'amqplib';
import { buildQueueNames } from './rabbitmq.config.js';

export async function setupQueueWithDLQ(
  channel: Channel,
  exchange: string,
  queueBaseName: string,
) {
  const { main, retry, dlq } = buildQueueNames(queueBaseName);

  //Make sure the DLQ/retry exchange exists
  await channel.assertExchange(exchange, 'topic', { durable: true });

  // DLQ
  await channel.assertQueue(dlq, { durable: true });

  // Retry queue (messages move here temporarily)
  await channel.assertQueue(retry, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': exchange,
      'x-dead-letter-routing-key': `${queueBaseName}.retry`,
      'x-message-ttl': 10000, // 10s delay before retry
    },
  });

  // Main queue (failed messages go to retry)
  await channel.assertQueue(main, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': exchange,
      'x-dead-letter-routing-key': `${queueBaseName}.retry`,
    },
  });

  // Bind queues
  await channel.bindQueue(main, exchange, queueBaseName);
  await channel.bindQueue(retry, exchange, `${queueBaseName}.retry`);
  await channel.bindQueue(dlq, exchange, `${queueBaseName}.dlq`);

  console.log(`[RabbitMQ] 🧩 DLQ/Retry setup done for ${main}`);
}

