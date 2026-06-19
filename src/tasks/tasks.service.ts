import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../db';
import { tasks } from '../db/schema';
import { and, eq } from 'drizzle-orm';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  async create(userId: string, dto: CreateTaskDto) {
    const [task] = await db
      .insert(tasks)
      .values({ ...dto, userId })
      .returning();
    return task;
  }

  async findAllForUser(userId: string) {
    return db.query.tasks.findMany({ where: eq(tasks.userId, userId) });
  }

  async findFirstWithException(id: string, userId?: string) {
    const task = await db.query.tasks.findFirst({ where: eq(tasks.id, id) });
    if (!task) {
      throw new NotFoundException(`Task not found`);
    }
    if (userId && task?.userId !== userId) {
      throw new ForbiddenException(
        `You don't have permission to use this task`,
      );
    }
    return task;
  }

  async update(userId: string, id: string, dto: Partial<CreateTaskDto>) {
    const task = await this.findFirstWithException(id, userId);
    await db
      .update(tasks)
      .set({ ...dto, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    return task;
  }

  async remove(id: string, userId: string) {
    await this.findFirstWithException(id, userId);
    await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return 'task has been removed';
  }
}
