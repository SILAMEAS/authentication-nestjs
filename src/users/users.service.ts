import { BadRequestException, Injectable } from '@nestjs/common';
import { NewUser, users } from '../drizzle/schema';
import { db } from '../drizzle';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersService {
  async findByEmail(email: string) {
    return db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }
  async findById(id: string) {
    return db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async findByToken(token: string) {
    return db.query.users.findFirst({
      where: eq(users.token, token),
    });
  }

  async findByResetToken(resetToken: string) {
    return db.query.users.findFirst({
      where: eq(users.resetToken, resetToken),
    });
  }

  async create(createUserDto: NewUser) {
    const [user] = await db.insert(users).values(createUserDto).returning();
    return user;
  }

  async findAll() {
    return db.query.users.findMany();
  }

  async update(id: string, updateUserDto: Partial<NewUser>) {
    const [user] = await db
      .update(users)
      .set({ ...updateUserDto, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async remove(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new BadRequestException('User does not exist');
    }
    db.delete(users).where(eq(users.id, id));
    return 'deleted user';
  }
}
