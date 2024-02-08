// import { Injectable, Logger } from '@nestjs/common';
// import { sql } from 'drizzle-orm';
// import { NodePgDatabase } from 'drizzle-orm/node-postgres';
// import { eq } from 'drizzle-orm';
// import { eventsTable, SelectToken, tokensTable } from '../schema/schema';
// import { InjectDatabase } from '../store';
// import * as dayjs from 'dayjs';
//
// const HIGH_WATER_MARK_NAME = 'HighWaterMark';
//
// @Injectable()
// export class HighWaterMarkAgent {
//     logger = new Logger(HighWaterMarkAgent.name);
//
//     constructor(@InjectDatabase() private readonly db: NodePgDatabase<any>) {}
//
//     public highWaterMark: number = 1;
//
//     private slowPollDurationInMs: number = 1000;
//
//     private fastPollDurationInMs: number = 500;
//
//     private staleDurationInSeconds: number = 3;
//
//     async start(): Promise<void> {
//         const trackingToken = await this.getTrackingToken();
//
//         this.highWaterMark = trackingToken.lastSequenceId;
//
//         this.logger.log(`HighWaterMark starting at ${this.highWaterMark}`);
//
//         await this.poll(trackingToken);
//     }
//
//     async poll(trackingToken: SelectToken) {
//         const latestSequenceId = await this.getLatestSequenceId();
//
//         // already update to date, just check again in 1 second.
//         if (this.highWaterMark === latestSequenceId) {
//             return setTimeout(() => {
//                 this.poll(trackingToken).then();
//             }, this.fastPollDurationInMs);
//         }
//
//         const gap = await this.checkForGap(trackingToken.lastSequenceId);
//
//         // no gap, simply update the tracking token and re-poll to check for changes.
//         if (gap === null) {
//             trackingToken = await this.updateTrackingToken(latestSequenceId);
//
//             this.highWaterMark = trackingToken.lastSequenceId;
//
//             this.logger.log(
//                 `no gaps detected, updating the HighWaterMark to the latest available sequenceId ${latestSequenceId}`,
//             );
//
//             return setTimeout(() => {
//                 this.poll(trackingToken).then();
//             }, this.fastPollDurationInMs);
//         }
//
//         // new gap, re-poll in 1 seconds to check if the gap still exists.
//         if (
//             dayjs(gap.timestamp).diff(new Date(), 'seconds') >=
//             this.staleDurationInSeconds
//         ) {
//             this.logger.log(
//                 `new gap detected, checking again in ${
//                     this.slowPollDurationInMs / 1000
//                 } seconds.`,
//             );
//
//             return setTimeout(() => {
//                 this.poll(trackingToken).then();
//             }, this.slowPollDurationInMs);
//         }
//
//         // stale gap found, it has existed longer than the configured stale duration (default : 3 seconds), assume event has been rejected.
//         this.logger.log(
//             `stale gap detected between ${gap.sequenceId} and ${
//                 gap.sequenceId + 2
//             }, updating tracking token latestSequenceId to ${
//                 gap.sequenceId + 1
//             }`,
//         );
//
//         trackingToken = await this.updateTrackingToken(gap.sequenceId + 1);
//
//         // the next poll iteration should find no gaps and update the tracking token.
//         return setTimeout(() => {
//             this.poll(trackingToken).then();
//         }, this.slowPollDurationInMs);
//     }
//
//     async checkForGap(
//         fromSequenceId: number,
//     ): Promise<{ sequenceId: number; timestamp: string } | null> {
//         const result = await this.db.execute(sql`select sequence_id from (
//            select
//                sequence_id,
//                lead(sequence_id)
//                over (order by sequence_id) as no
//                from events where sequence_id >= ${fromSequenceId}
//           ) ct
//             where no is not null
//             and no - sequence_id > 1
//             limit 1;`);
//
//         if (result.rowCount > 0) {
//             return {
//                 sequenceId: result.rows[0]['sequence_id'] as number,
//                 timestamp: result.rows[0]['timestamp'] as string,
//             };
//         }
//
//         return null;
//     }
//
//     async getTrackingToken(): Promise<SelectToken> {
//
//         const tokens = await this.db
//             .select()
//             .from(tokensTable)
//             .where(eq(tokensTable.name, HIGH_WATER_MARK_NAME))
//             .limit(1);
//
//         if (tokens.length) {
//             return tokens[0];
//         }
//
//         const newTokens = await this.db
//             .insert(tokensTable)
//             .values({
//                 name: HIGH_WATER_MARK_NAME,
//                 lastSequenceId: await this.getLatestSequenceId(),
//                 timestamp: new Date().toISOString(),
//             })
//             .returning();
//
//         return newTokens[0];
//     }
//
//     async updateTrackingToken(lastSequenceId: number): Promise<SelectToken> {
//         this.logger.log(
//             `HighWaterMark updating tracking token to ${lastSequenceId}`,
//         );
//
//         const updatedTokens = await this.db
//             .update(tokensTable)
//             .set({
//                 lastSequenceId,
//                 timestamp: new Date().toISOString(),
//             })
//             .where(eq(tokensTable.name, HIGH_WATER_MARK_NAME))
//             .returning();
//
//         return updatedTokens[0];
//     }
//
//     async getLatestSequenceId(): Promise<number> {
//         const result = await this.db
//             .select({ max: sql`max(sequence_id)` })
//             .from(eventsTable);
//
//         if (result[0].max !== null) {
//             return result[0].max as number;
//         }
//
//         return -1;
//     }
// }
