import { boolean, pgEnum, pgTable, text, timestamp, uuid, } from 'drizzle-orm/pg-core';

/** ____________________ Enum __________________  */
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const taskStatusEnum = pgEnum('task_status', [
  'todo',
  'in_progress',
  'done',
]);

/** ____________________ Entity  __________________  */

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('passwordHash').notNull(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  isVerified: boolean('is_verified').notNull().default(false),
  token: text('token'),
  tokenExp: timestamp('token_exp'),
  resetToken: text('reset_token'),
  resetTokenExp: timestamp('reset_token_exp'),
  refreshTokenHash: text('refresh_token_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: taskStatusEnum('status').notNull().default('todo'),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/** ____________________ Type  __________________  */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
