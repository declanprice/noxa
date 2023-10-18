export class GroupCannotHandleEventTypeError extends Error {
  constructor(groupName: string, eventType: string) {
    super(
      `group with name ${groupName} cannot handle event of type ${eventType}`,
    );
  }
}
