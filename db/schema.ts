import {sqliteTable,text,integer,index,uniqueIndex} from 'drizzle-orm/sqlite-core';
export const packages=sqliteTable('packages',{
 key:text('key').primaryKey(),kind:text('kind').notNull(),value:text('value'),
 token:text('token'),lease:integer('lease').notNull().default(0),updated:integer('updated').notNull(),
});
export const characters=sqliteTable('characters',{
 id:text('id').primaryKey(),owner:text('owner').notNull(),value:text('value').notNull(),
 revision:integer('revision').notNull().default(0),lastOp:text('last_op'),updated:integer('updated').notNull(),
},t=>[index('characters_owner_updated').on(t.owner,t.updated)]);
export const visits=sqliteTable('visits',{
 id:text('id').primaryKey(),character:text('character').notNull(),x:integer('x').notNull(),y:integer('y').notNull(),
 value:text('value').notNull(),at:integer('at').notNull(),
},t=>[index('visits_character_at').on(t.character,t.at),index('visits_cell_at').on(t.x,t.y,t.at)]);
export const claims=sqliteTable('claims',{
 key:text('key').primaryKey(),character:text('character').notNull(),operation:text('operation').notNull(),at:integer('at').notNull(),
});
export const credentials=sqliteTable('character_credentials',{
 character:text('character').primaryKey(),nameKey:text('name_key').notNull(),passwordHash:text('password_hash'),created:integer('created').notNull(),
},t=>[uniqueIndex('character_names_global_unique').on(t.nameKey)]);
export const sessions=sqliteTable('character_sessions',{
 tokenHash:text('token_hash').primaryKey(),character:text('character').notNull(),expires:integer('expires').notNull(),
},t=>[index('character_sessions_expiry').on(t.expires)]);
export const authAttempts=sqliteTable('auth_attempts',{
 key:text('key').primaryKey(),count:integer('count').notNull(),expires:integer('expires').notNull(),
});
export const settings=sqliteTable('server_settings',{
 key:text('key').primaryKey(),value:text('value').notNull(),
});

export const generationJobs=sqliteTable('generation_jobs',{
 id:text('id').primaryKey(),lane:text('lane').notNull(),scope:text('scope').notNull(),request:text('request').notNull(),
 status:text('status').notNull(),priority:integer('priority').notNull().default(1),result:text('result'),error:text('error'),token:text('token'),
 lease:integer('lease').notNull().default(0),available:integer('available').notNull().default(0),attempts:integer('attempts').notNull().default(0),
 created:integer('created').notNull(),touched:integer('touched').notNull(),
},t=>[index('generation_jobs_lane_status').on(t.lane,t.status,t.lease),index('generation_jobs_scope').on(t.scope)]);
