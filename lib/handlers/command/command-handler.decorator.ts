
export const COMMAND_HANDLER_METADATA = 'COMMAND_HANDLER_METADATA';

export const CommandHandler = (
  type: string,
): ClassDecorator => {
  return (target: object) => {
    Reflect.defineMetadata(COMMAND_HANDLER_METADATA, type, target);
  };
};
