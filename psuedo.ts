@StreamProjection({
  type: EventProjectionType.Document,
  async: false,
})
class CustomerEmailProjection {
  customerId: string;
  email: string;

  @EventHandler(CustomerRegistered, (e) => e.customerId)
  onCustomerRegistered(event: CustomerRegistered) {
    this.customerId = e.customerId;
    this.email = e.email;
  }
}

@StreamProjection({
  type: EventProjectionType.Document,
  async: true,
  batchSize: 100,
  sideEffects: true,
})
class CustomerProjection {
  name: string;

  @EventHandler(CustomerRegistered, (e) => e.id)
  onCustomerRegistered(event: CustomerRegistered) {
    this.name = e.name;
  }

  @SideEffect()
  onSideEffect() {}
}

@StreamProjection({
  type: EventProjectionType.Generic,
  async: false,
})
class GenericEventProjection {
  @EventHandler(CustomerRegistered)
  onCustomerRegistered(event: CustomerRegistered) {
    // dynamodb action here...
  }
}

@Stream({
  name: 'customer',
  snapshotPeriod: 10,
})
class CustomerStream {
  customerId: string;
  name: string;

  @EventSourcingHandler(CustomerRegistered)
  onCustomerRegistered(event: CustomerRegistered) {
    this.customerId = event.customerId;
    this.name = event.name;
  }
}

@CommandHandler(RegisterCustomer)
class RegisterCustomerHandler {
  constructor(store: EventStore, bus: EventBus) {}
  async handle(command: RegisterCustomer) {
    const event = new CustomerRegisteredEvent(data);

    // for internal projections
    await this.store.startStream(Customer, event);

    // for external services
    await this.bus.publish(event); // publish event to same context
    await this.bus.publish(event, {toContext: ''}); // publish event to another context
  }

  async handle(command) {
    const { aggregate, append } = await this.store.hydrateStream(
      Customer,
      event.customerId,
    );

    // validation if event can be applied to internal store;

    await append(new InternalEvent());
  }
}

@QueryHandler(GetCustomerByIdQuery)
class QueryHandler {
  constructor(store: DocumentStore) {}

  async handle(query: GetCustomerByIdQuery) {
    return await this.store.getById(CustomerProjection, query.customerId);
  }
}

// PUB_SUB = all instances of the group gets all messages (not all buses can support pub/sub)
// FIFO = one instance of the group will take messages from the queue in FIFO order (different bus may have fifo ordering consumer rules),
// STANDARD = any instance of group will compete for messages from queue
@EventHandler(GenericIntegrationEvent, { consumerType: EventConsumerType.PUB_SUB, group: 'customer_events' })
class EventHandler {
  constructor(store: DocumentStore) {}

  async handle(event: Event) {
    // handl event
  }
}

@EventHandler(GenericIntegrationEvent, { consumerType: EventConsumerType.PUB_SUB, group: 'customer_events' })
class EventHandler {
  constructor(store: DocumentStore) {}

  async handle(event: Event) {
    // handl event
  }
}



@Saga({
  consumerType: SagaConsumerType.FIFO, // SagaConsumerType.STANDARD
})
class CustomerSaga extends Saga {

  define(data: CreateCustomerSagaData) {
    const saga = this.createDefinition();

    saga
      .addStep(1)
      .named('RegisterCustomerStep')
      .thenPublishCommand(new DoSomethingCommand())
      .toContext('customer')
      .withCompensationCommand(new RemoveCustomerRegistration())
      .andExpectEvent('customerRegistered', (e) => e.customerId);

    saga
      .addStep(2)
      .named('ChangeCustomerNameStep')
      .thenPublishCommand(new ChangeCustomerName())
      .toContext('customer')
      .andExpectEvent('customerNameChanged', (e) => e.customerId)


    saga.failOn
      .events(['failedOneEvent', 'failedTwoEvent'])
      .orTimeout(dayjs().add('minutes', 1));

    return saga;
  }
}

@Process(
  consumerType: ProcessConsumerType.FIFO,
)
class CustomerProcess extends Process {
  constructor(
    commandBus: CommandBus,
    eventBus: EventBus,
  ) {}

  @StartProcess(CustomerRegistered, (e) => e.customerId)
  async onCustomerRegistered(e) {
    await this.associateWith('otherId', e.otherId);
    await this.removeAssociation('otherId', e.otherId);

    // execute on local thread and commit changes with process changes [atomically]
    const { ok, error } = await this.commandBus.execute(
      new DoSomethingCommand(),
    );

    // publish command to external command bus with process state changes [atomically]
    const { ok, error } = await this.commandBus.publish(
      new DoSomethingCommand(),
    );
  }

  @ProcessEventHandler(CustomerNameChanged, (e) => e.customerId)
  async onCustomerNameChanged() {
    const scheduledEventId = this.eventBus.schedule({
      event: new ScheduledEvent(),
      dateTime: dayjs.add('minutes', 10),
    });

    this.eventBus.unschedule(scheduledEventId);
  }

  @ProcessEventHandler(ScheduledEvent, (e) => e.customerId)
  onScheduledEvent() {
    // i was scheduled
    this.processLifeCycle.end();
  }
}

class ExampleController {
  constructor(commandBus: CommndBus, queryBus: QueryBus, eventBus: EventBus) {}

  doSomething() {
    this.commandbus.execute(new DoSomethingcommand()); // execute on local thread.
    this.commandBus.publish(new DoSomethingCommandAsync()); // transactional publish command to message outbox.
    this.commandBus.send(new DoSomethingCommandAsync()); // regular publish event to command bus.

    this.queryBus.execute(new GetSomethingQuery()); // execute on local thread.

    this.eventBus.publish(new DoneSomethingEvent()); // transactional publish event to message outbox which then publishes to event bus.
    this.eventBus.send(new DoneSomethingEvent()); // regular publish event to event bus.
  }
}

interface NoxaMessage {
  fromContext: 'customer';
  tenantId: 'DEFAULT';
  timestamp: '1998-02-02T13:30:3000Z';
  type: 'customerRegistered';
  data: {
    // data
  };
}

// version one supports only postgres & rabbitmq
NoxaModule.forRoot({
  context: 'customer',
  postgres,
  bus: rabbitMqBus(),
  projections: [
    CustomerEmailProjection, // sync
    CustomerProjection // async handled by daemon
  ],
  handlers: {
    commands: [
      RegisterCustomerHandler
    ],
    queries: [
      GetCustomerByIdHandler
    ],
    events: [
      ChatMessageEventHandlers
    ],
    sagas: [
      CustomerSaga
    ],
    processes: [
      CustomerProcess
    ],
  },
  autoCreateResources: true,
  asyncDaemon: {
    enabled: true,
    mode: AsyncDaemonMode.HotCold,
    disableBusListenersWhenActive: true, // allow other running instances to handle command/events/queries and allow the async daemon 100% of the resources of one instance.
  },
});
