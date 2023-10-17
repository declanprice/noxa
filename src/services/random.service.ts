import { Injectable } from '@nestjs/common';

@Injectable()
export class RandomService {
  get() {
    return 22;
  }
}
