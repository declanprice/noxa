import {
  ChangeCustomerAge,
  ChangeCustomerName,
  CustomerAgeChanged,
  CustomerNameChanged,
  CustomerRegistered,
  CustomerStream,
  FailToChangeCustomerAge,
  RegisterCustomer,
} from '../../model/streams/customer.stream';

import { CommandHandler, HandleCommand, StoreSession } from '../../../lib';

@CommandHandler(RegisterCustomer)
export class RegisterCustomerHandler
  implements HandleCommand<RegisterCustomer>
{
  constructor(private session: StoreSession) {}

  async handle(command: RegisterCustomer) {
    const session = await this.session.start();

    try {
      const event = new CustomerRegistered(
        command.customerId,
        command.name,
        command.age,
      );

      await session.event.startStream(
        CustomerStream,
        command.customerId,
        event,
      );

      await session.outbox.publishEvent(event);

      await session.commit();
    } catch (error) {
      console.log(error);
      await session.rollback();
    } finally {
      session.release();
    }
  }
}

@CommandHandler(ChangeCustomerName)
export class ChangeCustomerNameHandler
  implements HandleCommand<ChangeCustomerName>
{
  constructor(private session: StoreSession) {}

  async handle(command: ChangeCustomerName) {
    const session = await this.session.start();

    try {
      const event = new CustomerNameChanged(command.customerId, command.name);

      await session.event.appendEvent(
        CustomerStream,
        command.customerId,
        event,
      );

      await session.outbox.publishEvent(event);

      await session.commit();
    } catch (error) {
      await session.rollback();
    } finally {
      session.release();
    }
  }
}

@CommandHandler(ChangeCustomerAge)
export class ChangeCustomerAgeCommandHandler
  implements HandleCommand<ChangeCustomerAge>
{
  constructor(private session: StoreSession) {}

  async handle(command: ChangeCustomerAge) {
    const session = await this.session.start();

    try {
      const event = new CustomerAgeChanged(command.customerId, command.age);

      await session.event.appendEvent(
        CustomerStream,
        command.customerId,
        event,
      );

      if (command.age == 100) {
        await session.outbox.publishEvent(
          new FailToChangeCustomerAge(command.customerId),
        );
      } else {
        await session.outbox.publishEvent(event);
      }

      await session.commit();
    } catch (error) {
      await session.rollback();
    } finally {
      session.release();
    }
  }
}
