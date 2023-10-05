import { Logger } from '@nestjs/common';
export declare class BusOutbox {
    logger: Logger;
    constructor();
    execute(): void;
}
