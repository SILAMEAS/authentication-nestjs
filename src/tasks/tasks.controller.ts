import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '../db/schema';
import { CreateTaskDto } from './dto/create-task.dto';

@ApiTags('Tasks')
@Controller('tasks')
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Get tasks for current user' })
  findAll(@CurrentUser() user: User) {
    return this.tasksService.findAllForUser(user.id);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get tasks for current user' })
  findByID(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tasksService.findFirstWithException(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create task' })
  create(@CurrentUser() user: User, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task' })
  delete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.tasksService.remove(user.id, id);
  }
}
