import { Knex } from 'knex';
import { Meal } from './meal';

declare module 'knex/types/tables' {
  export interface Tables {
    meals: Meal;
  }
}
