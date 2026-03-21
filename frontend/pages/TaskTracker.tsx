import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import TaskCard from '@/components/TaskCard';
import { useUser } from '@/contexts/UserContext';
import { taskAPI } from '@/services/api';
import { sanitizeTaskContent } from '@/utils/sanitize';

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  dueDate?: string;
  estimatedTime?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

const TaskTracker = () => {
  const { currentUser } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'todo' as 'todo' | 'in_progress' | 'done',
    dueDate: '',
    estimatedTime: '',
    tags: ''
  });

  useEffect(() => {
    const initializeTasks = async () => {
      try {
        if (currentUser) {
          const apiTasks = await taskAPI.getAll();
          setTasks(apiTasks);
          setApiAvailable(true);
        } else {
          const storedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
          setTasks(storedTasks);
        }
      } catch (error) {
        console.error('Error loading tasks:', error);
        const storedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        setTasks(storedTasks);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTasks();
  }, [currentUser]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      dueDate: '',
      estimatedTime: '',
      tags: ''
    });
  };

  const handleAddTask = async (newTaskData: Partial<Task>) => {
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "Task title is required.", variant: "destructive" });
      return;
    }
    
    const sanitizedTaskData = {
      ...newTaskData,
      title: sanitizeTaskContent(newTaskData.title || ''),
      description: sanitizeTaskContent(newTaskData.description || '')
    };
    
    try {
      if (currentUser) {
        const newTask = await taskAPI.create(sanitizedTaskData);
        setTasks([newTask, ...tasks]);
      } else {
        // Fallback to localStorage
        const newTask: Task = {
          _id: Date.now().toString(),
          ...sanitizedTaskData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as Task;
        const updatedTasks = [newTask, ...tasks];
        setTasks(updatedTasks);
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
      }
      
      toast({ title: "Success!", description: "Task created successfully." });
      resetForm();
      setIsAddingTask(false);
    } catch (error) {
      console.error('Error creating task:', error);
      toast({ title: "Error", description: "Failed to create task. Please try again.", variant: "destructive" });
    }
  };

  const handleUpdateTask = async (id: string, updatedData: Partial<Task>) => {
    try {
      if (currentUser) {
        const updatedTask = await taskAPI.update(id, updatedData);
        setTasks(tasks.map(task => (task._id === id ? updatedTask : task)));
      } else {
        const updatedTasks = tasks.map(task =>
          task._id === id
            ? { ...task, ...updatedData, updatedAt: new Date().toISOString() }
            : task
        );
        setTasks(updatedTasks);
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
      }

      toast({
        title: 'Success!',
        description: 'Task updated successfully.'
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: Task['status']) => {
    await handleUpdateTask(id, { status: newStatus });
  };

  const handleDeleteTask = async (id: string) => {
    try {
      if (currentUser) {
        await taskAPI.delete(id);
        setTasks(tasks.filter(task => task._id !== id));
      } else {
        const updatedTasks = tasks.filter(task => task._id !== id);
        setTasks(updatedTasks);
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
      }

      toast({
        title: 'Success!',
        description: 'Task deleted successfully.'
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getStatusCount = (status: Task['status']) => tasks.filter(task => task.status === status).length;
  const getPriorityCount = (priority: Task['priority']) => tasks.filter(task => task.priority === priority).length;

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading tasks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="mb-8 animate-slide-in">
        <h1 className="text-3xl font-bold tracking-tight">Task Tracker</h1>
        <p className="text-muted-foreground mt-1">
          Organize your tasks and track your progress
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Badge variant="secondary">{tasks.length}</Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
            <CardTitle className="text-sm font-medium">To Do</CardTitle>
            <Badge variant="outline">{getStatusCount('todo')}</Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Badge variant="outline">{getStatusCount('in_progress')}</Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Badge variant="outline">{getStatusCount('done')}</Badge>
          </CardHeader>
        </Card>
      </div>

      <div className="mb-6">
        <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter task title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter task description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={value => setFormData({ ...formData, priority: value as 'low' | 'medium' | 'high' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={value => setFormData({ ...formData, status: value as 'todo' | 'in_progress' | 'done' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="estimatedTime">Estimated Time (min)</Label>
                  <Input
                    id="estimatedTime"
                    type="number"
                    value={formData.estimatedTime}
                    onChange={e => setFormData({ ...formData, estimatedTime: e.target.value })}
                    placeholder="60"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="work, urgent, project"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddingTask(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                const newTaskData = {
                  title: formData.title,
                  description: formData.description,
                  priority: formData.priority,
                  status: formData.status,
                  dueDate: formData.dueDate || undefined,
                  estimatedTime: formData.estimatedTime ? Number(formData.estimatedTime) : undefined,
                  tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : undefined
                };
                handleAddTask(newTaskData);
              }}>
                Add Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-muted-foreground text-center">
                <p className="text-lg font-medium mb-2">No tasks yet</p>
                <p className="text-sm">Create your first task to get started!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task._id}
              task={task}
              onUpdate={handleUpdateTask}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TaskTracker;
