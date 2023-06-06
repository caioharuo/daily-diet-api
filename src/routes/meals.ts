import { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { knex } from '../database';
import { checkUserIdExists } from '../middlewares/check-user-id-exists';
import { getBestSequenceWithinDiet } from '../utils/get-best-sequence-within-diet';

export async function mealsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [checkUserIdExists],
    },
    async (request) => {
      const { userId } = request.cookies;

      const meals = await knex('meals').where('user_id', userId).select('*');

      return { meals };
    }
  );

  app.get(
    '/:id',
    {
      preHandler: [checkUserIdExists],
    },
    async (request) => {
      const { userId } = request.cookies;

      const getMealByIdParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = getMealByIdParamsSchema.parse(request.params);

      const meal = await knex('meals')
        .where({
          id,
          user_id: userId,
        })
        .first();

      return { meal };
    }
  );

  app.get(
    '/metrics',
    {
      preHandler: [checkUserIdExists],
    },
    async (request) => {
      const { userId } = request.cookies;

      const meals = await knex('meals').where('user_id', userId).select();

      const mealsAmount = meals.length;

      const dietMealsAmount = meals.filter((meal) => meal.is_diet_meal).length;

      const nonDietMealsAmount = mealsAmount - dietMealsAmount;
      const bestSequenceWithinDiet = getBestSequenceWithinDiet(meals);

      return {
        metrics: {
          mealsAmount,
          dietMealsAmount,
          nonDietMealsAmount,
          bestSequenceWithinDiet,
        },
      };
    }
  );

  app.delete(
    '/:id',
    {
      preHandler: [checkUserIdExists],
    },
    async (request, reply) => {
      const { userId } = request.cookies;

      const deleteMealByIdParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = deleteMealByIdParamsSchema.parse(request.params);

      await knex('meals')
        .where({
          id,
          user_id: userId,
        })
        .first()
        .delete();

      return reply.status(204).send();
    }
  );

  app.post('/', async (request, reply) => {
    const createNewMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      date: z.string().default(String(new Date())),
      is_diet_meal: z.coerce.boolean(),
    });

    const {
      name,
      description,
      date,
      is_diet_meal: isDietMeal,
    } = createNewMealBodySchema.parse(request.body);

    let userId = request.cookies.userId;

    if (!userId) {
      userId = randomUUID();

      reply.cookie('userId', userId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });
    }

    await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      date,
      is_diet_meal: isDietMeal,
      user_id: userId,
    });

    return reply.status(201).send();
  });

  app.put(
    '/:id',
    {
      preHandler: [checkUserIdExists],
    },
    async (request, reply) => {
      const { userId } = request.cookies;

      const updateMealParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = updateMealParamsSchema.parse(request.params);

      const updateMealBodySchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        date: z.string().default(String(new Date())).optional(),
        is_diet_meal: z.coerce.boolean().optional(),
      });

      const { name, description, date, is_diet_meal } =
        updateMealBodySchema.parse(request.body);

      await knex('meals')
        .where({
          id,
          user_id: userId,
        })
        .update({
          name,
          description,
          date,
          is_diet_meal,
        });

      return reply.status(204).send();
    }
  );
}
