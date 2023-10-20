export type BusMessage = {
  // the default is new Date().toISOString(), otherwise specify a date-time when the message can be published.
  timestamp: string;

  // the message type of command or event, eg - RegisterCustomer
  type: string;

  // the command or event data
  data: any;
};
