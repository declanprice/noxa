import {
    boolean,
    integer,
    jsonb,
    pgTable,
    timestamp,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';

export {
    eventsTable,
    streamsTable,
    tokensTable,
    outboxTable,
    processesTable,
} from '../lib/schema/schema';

export const customers = pgTable('customers', {
    id: uuid('id').primaryKey(),
    firstName: varchar('first_name').notNull(),
    lastName: varchar('last_name').notNull(),
    email: varchar('email').notNull(),
});

export const products = pgTable('products', {
    id: uuid('id').primaryKey(),
    name: varchar('name').notNull(),
    description: varchar('description').notNull(),
    category: varchar('category').notNull(),
    price: integer('price').notNull(),
    photoUrl: varchar('photo_url'),
    removed: boolean('removed').notNull().default(false),
});

export const orders = pgTable('orders', {
    id: uuid('id').primaryKey(),
    customerId: uuid('customer_id').notNull(),
    paymentId: uuid('payment_id').notNull(),
    lineItems: jsonb('line_items').notNull(),
    status: varchar('status').notNull(),
});

export const payments = pgTable('payments', {
    id: uuid('id').primaryKey(),
    amount: integer('amount').notNull(),
    orderId: uuid('order_id').notNull(),
    refunded: boolean('refunded').notNull().default(false),
});

export const inventory = pgTable('inventory', {
    id: uuid('id').primaryKey(),
    name: varchar('name').notNull(),
    quantityAvailable: integer('quantity_available').notNull(),
});

export const shipments = pgTable('shipments', {
    id: uuid('id').primaryKey(),
    customerId: uuid('customer_id').notNull(),
    orderId: uuid('order_id').notNull(),
    addressLine1: varchar('address_line_1').notNull(),
    addressLine2: varchar('address_line_2').notNull(),
    postcode: varchar('postcode').notNull(),
    city: varchar('city').notNull(),
    status: varchar('status').notNull(),
});

export type Customer = typeof customers.$inferSelect;

export type Product = typeof products.$inferSelect;

export type Order = typeof orders.$inferSelect;

export type Payment = typeof payments.$inferSelect;

export type Inventory = typeof inventory.$inferSelect;

export type Shipment = typeof shipments.$inferSelect;
