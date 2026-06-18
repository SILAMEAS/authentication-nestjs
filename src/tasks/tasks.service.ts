import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db';
import { NewTask, tasks } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class TasksService {
  async create(data: NewTask) {
    return db.insert(tasks).values(data).returning();
  }

  async findAll() {
    return db.query.tasks.findMany();
  }

  async findOne(id: string) {
    return db.query.tasks.findFirst({ where: eq(tasks.id, id) });
  }

  async update(id: string, updateTaskDto: NewTask, userId: string) {
    const task = await this.findOne(id);
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    if (task.userId !== userId) {
      throw new NotFoundException(
        `this task not belong to user with id ${userId}`,
      );
    }
    await db
      .update(tasks)
      .set({ ...updateTaskDto })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async remove(id: string) {
    const task = await this.findOne(id);
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return 'task has been removed';
  }
}
