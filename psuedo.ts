@Saga({
  consumerType: RabbitmqConsumerType.SINGLE_ACTIVE_CONSUMER,
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
      .andExpectEvent('customerNameChanged', (e) => e.customerId);

    saga.failOn
      .events(['failedOneEvent', 'failedTwoEvent'])
      .orTimeout(dayjs().add('minutes', 1));

    return saga;
  }
}
