import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
    async onModuleInit() {
        await this.$connect();
    }
}

export type DatabaseTransactionClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use">
