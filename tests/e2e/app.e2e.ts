import { describe } from 'node:test';
import { Server } from 'http';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApplicationModule } from '../../src/app.module';
import * as request from 'supertest';
describe('AppController', () => {
  let server: Server;
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication();
    server = app.getHttpServer();
    await app.init();
  });

  it(`should return created entity`, () => {
    return request(server).get('/').expect(200, '2');
  });

  afterEach(async () => {
    await app.close();
  });
});
