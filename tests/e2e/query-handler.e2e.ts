import { describe } from 'node:test';
import { Server } from 'http';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DatabaseClient } from '../../lib/store/database-client.service';

describe('QueryHandler', () => {
    let server: Server;
    let app: INestApplication;
    let db: DatabaseClient;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = module.createNestApplication();
        db = module.get(DatabaseClient);
        server = app.getHttpServer();
        await app.init();
    });

    it(`should return created entity`, () => {
        return request(server).post('/test-command').expect(201);
    });

    afterEach(async () => {
        await app.close();
    });
});
