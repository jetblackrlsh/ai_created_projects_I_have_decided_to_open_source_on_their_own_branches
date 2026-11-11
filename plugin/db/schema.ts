import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const rolls = sqliteTable('roll_receipts', {receiptKey:text('receipt_key').primaryKey(), declarationHash:text('declaration_hash').notNull(), rawRoll:integer('raw_roll'), createdAt:text('created_at').notNull()});
