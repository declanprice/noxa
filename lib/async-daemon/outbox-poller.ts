import * as format from 'pg-format';
import { Pool } from 'pg';
import { Logger } from '@nestjs/common';
import { StoredOutboxMessage } from '../store/outbox-store/outbox-message/stored-outbox-message.type';
import { BusRelay } from '../bus';

export class OutboxPoller {
  constructor(
    private readonly client: Pool,
    private busRelay: BusRelay,
  ) {}

  logger = new Logger(OutboxPoller.name);

  pollTimeInMs = 100;

  async start(): Promise<any> {
    const result = await this.client.query({
      text: `select * from noxa_outbox where published = false order by timestamp ASC`,
    });

    if (result.rowCount === 0) {
      this.logger.log(
        `all messages have been published, checking again in 1 seconds.`,
      );

      return setTimeout(() => {
        this.start().then();
      }, this.pollTimeInMs);
    }

    this.logger.log(
      `found ${result.rowCount} unpublished messages, sending them to the bus now.`,
    );

    let messageIds: string[] = [];

    for (const row of result.rows as StoredOutboxMessage[]) {
      if (row.toBus === 'command') {
        await this.busRelay.sendCommand({
          fromContext: row.fromContext,
          toContext: row.toContext,
          type: row.type,
          timestamp: row.timestamp,
          tenantId: row.tenantId,
          data: row.data,
        });
      }

      if (row.toBus === 'event') {
        await this.busRelay.sendEvent({
          fromContext: row.fromContext,
          toContext: row.toContext,
          type: row.type,
          timestamp: row.timestamp,
          tenantId: row.tenantId,
          data: row.data,
        });
      }

      messageIds.push(row.id);
    }

    await this.client.query(
      format(
        `UPDATE noxa_outbox SET published = true, "publishedTimestamp" = now() WHERE id IN (%L)`,
        messageIds,
      ),
    );

    this.logger.log(
      `successfully published ${result.rowCount} messages, checking for more in 1 second.`,
    );

    return setTimeout(() => {
      this.start().then();
    }, this.pollTimeInMs);
  }
}
