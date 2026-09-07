import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
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
