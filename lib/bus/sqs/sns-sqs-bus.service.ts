import { BusRelay } from '../bus-relay.type';

export class SnsSqsBusService implements BusRelay {
    async init() {}

    async sendCommand() {}

    async sendEvent() {}

    async registerCommandHandler() {}

    async registerEventHandler() {}

    async registerEventGroupHandler() {}
}
