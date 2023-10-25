import { Pool, PoolClient } from 'pg';
import { ModuleRef } from '@nestjs/core';
import { Type } from '@nestjs/common';
import { Event } from '../../index';
import { StoredProjectionToken } from '../stored-projection-token';

export abstract class ProjectionHandler {
  constructor(public readonly moduleRef: ModuleRef) {}

  abstract handleEvents(
    connection: Pool | PoolClient,
    projection: Type,
    events: Event[],
  ): Promise<StoredProjectionToken>;

  async updateTokenPosition(
    connection: Pool | PoolClient,
    projection: Type,
    lastSequenceId: number,
  ): Promise<StoredProjectionToken> {
    const { rows, rowCount } = await connection.query({
      text: `update noxa_projection_tokens set "lastSequenceId" = $1, "lastUpdated" = $2 where "name" = $3 returning *`,
      values: [lastSequenceId, new Date().toISOString(), projection.name],
    });

    if (rowCount === 0) {
      throw new Error(
        `could not update projection token for ${projection.name}`,
      );
    }

    return rows[0] as StoredProjectionToken;
  }
}
