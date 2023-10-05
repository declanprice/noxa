import { doSomething } from '../../lib';

describe('index', () => {
  it('doSomething()', () => {
    expect(doSomething()).toEqual(2);
  });
});
