export type BusMessage = {
  // the context which the message was published from.
  fromContext: string;

  // the default is the context which the message was published from, otherwise specify the target context.
  toContext: string | null;

  // the default is "DEFAULT", otherwise specify a tenant id.
  tenantId: string;

  // the default is new Date().toISOString(), otherwise specify a date-time when the message can be published.
  timestamp: string;

  // the message type of command or event, eg - RegisterCustomer
  type: string;

  // the command or event data
  data: any;
};
