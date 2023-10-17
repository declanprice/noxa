export class QueueCannotHandleEventTypeError extends Error {
  constructor(queueName: string, eventType: string) {
    super(
      `queue with name ${queueName} cannot handle event of type ${eventType}`,
    );
  }
}
