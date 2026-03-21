
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, RadarChart, Radar, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  Calendar, Clock, TrendingUp, Target, Activity, BarChart3, 
  Brain, Heart, Zap, Award, Target as TargetIcon, Users, BookOpen,
  TrendingDown, AlertCircle, CheckCircle, XCircle, Star, Trophy
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { taskAPI, moodAPI, studyAPI, focusAPI } from '@/services/api';
import { toast } from '@/hooks/use-toast';

// Type definitions
interface MoodEntry {
  _id: string;
  mood: 'terrible' | 'bad' | 'neutral' | 'good' | 'excellent';
  note: string;
  date: string;
}

interface StudySession {
  _id: string;
  subject: string;
  date: string;
  startTime: string;
  duration: number; // in minutes
  notes: string;
}

interface FocusSession {
  _id: string;
  date: string;
  duration: number;
  type: 'work' | 'break';
}

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: string;
  status: 'todo' | 'in_progress' | 'done';
  dueDate?: string;
  estimatedTime?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface ProcessedDayData {
  day: string;
  score?: number;
  hours?: number;
  minutes?: number;
  sessions?: number;
  entries?: number;
}

interface AnalyticsInsights {
  productivityScore: number;
  consistencyScore: number;
  improvementAreas: string[];
  achievements: string[];
  recommendations: string[];
  weeklyTrend: 'improving' | 'declining' | 'stable';
  studyEfficiency: number;
  focusQuality: number;
  moodStability: number;
  overallWellness: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://sentience.onrender.com/api';

const Analytics = () => {
  const { currentUser } = useUser();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'semester'>('week');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [data, setData] = useState({
    tasks: [],
    moodEntries: [],
    studySessions: [],
    focusSessions: []
  });
  const [insights, setInsights] = useState<AnalyticsInsights>({
    productivityScore: 0,
    consistencyScore: 0,
    improvementAreas: [],
    achievements: [],
    recommendations: [],
    weeklyTrend: 'stable',
    studyEfficiency: 0,
    focusQuality: 0,
    moodStability: 0,
    overallWellness: 0
  });

  // Check API availability and load data
  useEffect(() => {
    const initializeData = async () => {
      try {
        if (currentUser) {
          // Load data directly — don't gate on health check
          setApiAvailable(true);
          const [apiTasks, apiMoodEntries, apiStudySessions, apiFocusSessions] = await Promise.all([
            taskAPI.getAll().catch(() => []),
            moodAPI.getAll().catch(() => []),
            studyAPI.getAll().catch(() => []),
            focusAPI.getAll().catch(() => [])
          ]);
          setData({
            tasks: apiTasks,
            moodEntries: apiMoodEntries,
            studySessions: apiStudySessions,
            focusSessions: apiFocusSessions
          });
        } else {
          // Load from localStorage for non-authenticated users
          const storedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
          const storedMoodEntries = JSON.parse(localStorage.getItem('moodEntries') || '[]');
          const storedStudySessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
          const storedFocusSessions = JSON.parse(localStorage.getItem('focusSessions') || '[]');
          setData({
            tasks: storedTasks,
            moodEntries: storedMoodEntries,
            studySessions: storedStudySessions,
            focusSessions: storedFocusSessions
          });
        }
      } catch (error) {
        console.error('Error loading analytics data:', error);
        toast({
          title: 'Error loading data',
          description: 'Failed to load analytics data. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [currentUser]);

  // Calculate insights when data changes
  useEffect(() => {
    if (data.tasks.length > 0 || data.moodEntries.length > 0 || data.studySessions.length > 0) {
      const newInsights = calculateInsights();
      setInsights(newInsights);
    }
  }, [data]);

  const calculateInsights = (): AnalyticsInsights => {
    const completedTasks = data.tasks.filter(task => task.status === 'done').length;
    const totalTasks = data.tasks.length;
    const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate consistency score based on regular activity
    const recentDays = 7;
    const activeDays = new Set(
      [...data.tasks, ...data.moodEntries, ...data.studySessions]
        .map(item => new Date(item.date || item.createdAt).toDateString())
    ).size;
    const consistencyScore = Math.round((activeDays / recentDays) * 100);

    // Identify improvement areas
    const improvementAreas = [];
    if (productivityScore < 70) improvementAreas.push('Task completion rate');
    if (consistencyScore < 50) improvementAreas.push('Daily consistency');
    if (data.moodEntries.length < 3) improvementAreas.push('Mood tracking');
    if (data.studySessions.length < 5) improvementAreas.push('Study sessions');

    // Identify achievements
    const achievements = [];
    if (productivityScore >= 80) achievements.push('High productivity');
    if (consistencyScore >= 70) achievements.push('Great consistency');
    if (data.moodEntries.length >= 7) achievements.push('Regular mood tracking');
    if (data.studySessions.length >= 10) achievements.push('Dedicated studying');

    // Generate recommendations
    const recommendations = [];
    if (productivityScore < 70) recommendations.push('Focus on completing tasks rather than starting new ones');
    if (consistencyScore < 50) recommendations.push('Try to maintain daily activity, even if small');
    if (data.moodEntries.length < 3) recommendations.push('Track your mood daily to understand patterns');
    if (data.studySessions.length < 5) recommendations.push('Schedule regular study sessions');

    // Determine weekly trend
    const recentData = [...data.tasks, ...data.studySessions]
      .filter(item => {
        const itemDate = new Date(item.date || item.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return itemDate >= weekAgo;
      });
    
    const previousWeekData = [...data.tasks, ...data.studySessions]
      .filter(item => {
        const itemDate = new Date(item.date || item.createdAt);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return itemDate >= twoWeeksAgo && itemDate < weekAgo;
      });

    let weeklyTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (previousWeekData.length > 0) {
      if (recentData.length > previousWeekData.length * 1.2) {
        weeklyTrend = 'improving';
      } else if (recentData.length < previousWeekData.length * 0.8) {
        weeklyTrend = 'declining';
      }
    }

    // Calculate additional metrics
    const studyEfficiency = data.studySessions.length > 0 
      ? Math.min(100, (data.studySessions.reduce((sum, session) => sum + session.duration, 0) / (data.studySessions.length * 60)) * 100)
      : 0;
    
    const focusQuality = data.focusSessions.length > 0
      ? Math.min(100, (data.focusSessions.filter(s => s.type === 'work').reduce((sum, session) => sum + session.duration, 0) / 60))
      : 0;
    
    const averageMood = data.moodEntries.length > 0
      ? data.moodEntries.reduce((sum, entry) => {
          const scores = { terrible: 1, bad: 2, neutral: 3, good: 4, excellent: 5 };
          return sum + scores[entry.mood];
        }, 0) / data.moodEntries.length
      : 3;
    
    const moodStability = data.moodEntries.length > 0
      ? Math.max(0, 100 - (data.moodEntries.reduce((sum, entry) => {
          const scores = { terrible: 1, bad: 2, neutral: 3, good: 4, excellent: 5 };
          return sum + Math.abs(scores[entry.mood] - averageMood);
        }, 0) / data.moodEntries.length) * 20)
      : 0;
    
    const overallWellness = Math.round((productivityScore + consistencyScore + studyEfficiency + focusQuality + moodStability) / 5);
    
    return {
      productivityScore,
      consistencyScore,
      improvementAreas,
      achievements,
      recommendations,
      weeklyTrend,
      studyEfficiency: Math.round(studyEfficiency),
      focusQuality: Math.round(focusQuality),
      moodStability: Math.round(moodStability),
      overallWellness
    };
  };

  const handleDataUpdate = async () => {
    setIsLoading(true);
    try {
      if (currentUser) {
        const [apiTasks, apiMoodEntries, apiStudySessions, apiFocusSessions] = await Promise.all([
          taskAPI.getAll().catch(() => []),
          moodAPI.getAll().catch(() => []),
          studyAPI.getAll().catch(() => []),
          focusAPI.getAll().catch(() => [])
        ]);
        setData({
          tasks: apiTasks,
          moodEntries: apiMoodEntries,
          studySessions: apiStudySessions,
          focusSessions: apiFocusSessions
        });
      }
      toast({
        title: 'Data updated',
        description: 'Analytics data has been refreshed.',
      });
    } catch (error) {
      console.error('Error updating data:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to update analytics data.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processMoodData = (moodEntries: MoodEntry[]): ProcessedDayData[] => {
    const moodScores = { terrible: 1, bad: 2, neutral: 3, good: 4, excellent: 5 };
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return days.map(day => {
      const dayEntries = moodEntries.filter(entry => entry.date.startsWith(day));
      const averageScore = dayEntries.length > 0
        ? dayEntries.reduce((sum, entry) => sum + moodScores[entry.mood], 0) / dayEntries.length
        : undefined;

      return {
        day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
        score: averageScore,
        entries: dayEntries.length
      };
    });
  };

  const processStudyData = (studySessions: StudySession[]): ProcessedDayData[] => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return days.map(day => {
      const daySessions = studySessions.filter(session => session.date.startsWith(day));
      const totalMinutes = daySessions.reduce((sum, session) => sum + session.duration, 0);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      return {
        day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
        hours,
        minutes,
        sessions: daySessions.length
      };
    });
  };

  const processFocusData = (focusSessions: FocusSession[]): ProcessedDayData[] => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return days.map(day => {
      const daySessions = focusSessions.filter(session => session.date.startsWith(day));
      const workSessions = daySessions.filter(session => session.type === 'work');
      const totalMinutes = workSessions.reduce((sum, session) => sum + session.duration, 0);

      return {
        day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
        minutes: totalMinutes,
        sessions: workSessions.length
      };
    });
  };

  const processTaskData = (tasks: Task[]) => {
    const statusCounts = {
      todo: tasks.filter(task => task.status === 'todo').length,
      in_progress: tasks.filter(task => task.status === 'in_progress').length,
      done: tasks.filter(task => task.status === 'done').length
    };

    const priorityCounts = {
      low: tasks.filter(task => task.priority === 'low').length,
      medium: tasks.filter(task => task.priority === 'medium').length,
      high: tasks.filter(task => task.priority === 'high').length
    };

    return { statusCounts, priorityCounts };
  };

  const moodScoreToLabel = (score: number) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Neutral';
    if (score >= 1.5) return 'Bad';
    return 'Terrible';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600';
      case 'declining':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const moodData = processMoodData(data.moodEntries);
  const studyData = processStudyData(data.studySessions);
  const focusData = processFocusData(data.focusSessions);
  const taskData = processTaskData(data.tasks);

  const statusColors = ['#ef4444', '#f59e0b', '#10b981'];
  const priorityColors = ['#10b981', '#f59e0b', '#ef4444'];

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="mb-8 animate-slide-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Track your productivity, mood, and study patterns
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={(value: 'week' | 'month' | 'semester') => setTimeRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="semester">Semester</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleDataUpdate} disabled={isLoading}>
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="wellness">Wellness</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="mood">Mood</TabsTrigger>
          <TabsTrigger value="study">Study</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.productivityScore}%</div>
                <Progress value={insights.productivityScore} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Task completion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consistency Score</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.consistencyScore}%</div>
                <Progress value={insights.consistencyScore} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Daily activity consistency
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weekly Trend</CardTitle>
                {getTrendIcon(insights.weeklyTrend)}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getTrendColor(insights.weeklyTrend)}`}>
                  {insights.weeklyTrend.charAt(0).toUpperCase() + insights.weeklyTrend.slice(1)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Compared to last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.studySessions.length + data.focusSessions.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Study + Focus sessions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Insights and Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insights.achievements.length > 0 ? (
                  <div className="space-y-2">
                    {insights.achievements.map((achievement, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">{achievement}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Keep working to earn achievements!</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insights.improvementAreas.length > 0 ? (
                  <div className="space-y-2">
                    {insights.improvementAreas.map((area, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <TargetIcon className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">{area}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Great job! No major areas for improvement.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Personalized Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {insights.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Zap className="h-4 w-4 text-blue-500 mt-0.5" />
                      <span className="text-sm">{recommendation}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">You're doing great! Keep up the good work.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wellness" className="space-y-6">
          {/* Wellness Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Wellness</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.overallWellness}%</div>
                <Progress value={insights.overallWellness} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {insights.overallWellness >= 80 ? 'Excellent!' : insights.overallWellness >= 60 ? 'Good' : 'Needs improvement'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Study Efficiency</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.studyEfficiency}%</div>
                <Progress value={insights.studyEfficiency} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {insights.studyEfficiency >= 80 ? 'Highly efficient' : insights.studyEfficiency >= 60 ? 'Good efficiency' : 'Room for improvement'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Focus Quality</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.focusQuality}%</div>
                <Progress value={insights.focusQuality} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {insights.focusQuality >= 80 ? 'Excellent focus' : insights.focusQuality >= 60 ? 'Good focus' : 'Needs work'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mood Stability</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.moodStability}%</div>
                <Progress value={insights.moodStability} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {insights.moodStability >= 80 ? 'Very stable' : insights.moodStability >= 60 ? 'Stable' : 'Variable mood'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Wellness Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Wellness Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={[
                  {
                    subject: 'Productivity',
                    A: insights.productivityScore,
                    fullMark: 100,
                  },
                  {
                    subject: 'Consistency',
                    A: insights.consistencyScore,
                    fullMark: 100,
                  },
                  {
                    subject: 'Study Efficiency',
                    A: insights.studyEfficiency,
                    fullMark: 100,
                  },
                  {
                    subject: 'Focus Quality',
                    A: insights.focusQuality,
                    fullMark: 100,
                  },
                  {
                    subject: 'Mood Stability',
                    A: insights.moodStability,
                    fullMark: 100,
                  },
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Your Score" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Wellness Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Wellness Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Strongest Area</span>
                    <Badge variant="secondary">
                      {(() => {
                        const areas = [
                          { name: 'Productivity', score: insights.productivityScore },
                          { name: 'Consistency', score: insights.consistencyScore },
                          { name: 'Study Efficiency', score: insights.studyEfficiency },
                          { name: 'Focus Quality', score: insights.focusQuality },
                          { name: 'Mood Stability', score: insights.moodStability }
                        ];
                        const strongest = areas.reduce((a, b) => a.score > b.score ? a : b);
                        return strongest.name;
                      })()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Needs Improvement</span>
                    <Badge variant="secondary">
                      {(() => {
                        const areas = [
                          { name: 'Productivity', score: insights.productivityScore },
                          { name: 'Consistency', score: insights.consistencyScore },
                          { name: 'Study Efficiency', score: insights.studyEfficiency },
                          { name: 'Focus Quality', score: insights.focusQuality },
                          { name: 'Mood Stability', score: insights.moodStability }
                        ];
                        const weakest = areas.reduce((a, b) => a.score < b.score ? a : b);
                        return weakest.name;
                      })()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall Grade</span>
                    <Badge variant="secondary">
                      {insights.overallWellness >= 90 ? 'A+' : 
                       insights.overallWellness >= 80 ? 'A' : 
                       insights.overallWellness >= 70 ? 'B' : 
                       insights.overallWellness >= 60 ? 'C' : 
                       insights.overallWellness >= 50 ? 'D' : 'F'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Wellness Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.overallWellness < 70 && (
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-500/10 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <span className="text-sm">Focus on building consistent daily habits</span>
                    </div>
                  )}
                  {insights.studyEfficiency < 70 && (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                      <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <span className="text-sm">Try the Pomodoro technique for better study sessions</span>
                    </div>
                  )}
                  {insights.focusQuality < 70 && (
                    <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-500/10 rounded-lg">
                      <Target className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                      <span className="text-sm">Minimize distractions during focus sessions</span>
                    </div>
                  )}
                  {insights.moodStability < 70 && (
                    <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
                      <Heart className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                      <span className="text-sm">Practice mindfulness and stress management</span>
                    </div>
                  )}
                  {insights.overallWellness >= 80 && (
                    <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-500/10 rounded-lg">
                      <Trophy className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                      <span className="text-sm">Excellent! Keep up the great work</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-6">
          {/* Task Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'To Do', value: taskData.statusCounts.todo, color: statusColors[0] },
                        { name: 'In Progress', value: taskData.statusCounts.in_progress, color: statusColors[1] },
                        { name: 'Done', value: taskData.statusCounts.done, color: statusColors[2] }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {[
                        { name: 'To Do', value: taskData.statusCounts.todo, color: statusColors[0] },
                        { name: 'In Progress', value: taskData.statusCounts.in_progress, color: statusColors[1] },
                        { name: 'Done', value: taskData.statusCounts.done, color: statusColors[2] }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { priority: 'Low', count: taskData.priorityCounts.low },
                    { priority: 'Medium', count: taskData.priorityCounts.medium },
                    { priority: 'High', count: taskData.priorityCounts.high }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priority" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Focus Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Focus Sessions (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={focusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="minutes" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mood" className="space-y-6">
          {/* Mood Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Mood Trends (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={moodData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[1, 5]} />
                  <Tooltip 
                    formatter={(value: number) => [moodScoreToLabel(value), 'Mood Score']}
                    labelFormatter={(label) => `Day: ${label}`}
                  />
                  <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Mood Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mood Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Excellent', value: data.moodEntries.filter(e => e.mood === 'excellent').length },
                        { name: 'Good', value: data.moodEntries.filter(e => e.mood === 'good').length },
                        { name: 'Neutral', value: data.moodEntries.filter(e => e.mood === 'neutral').length },
                        { name: 'Bad', value: data.moodEntries.filter(e => e.mood === 'bad').length },
                        { name: 'Terrible', value: data.moodEntries.filter(e => e.mood === 'terrible').length }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {[
                        { name: 'Excellent', value: data.moodEntries.filter(e => e.mood === 'excellent').length, color: '#10b981' },
                        { name: 'Good', value: data.moodEntries.filter(e => e.mood === 'good').length, color: '#3b82f6' },
                        { name: 'Neutral', value: data.moodEntries.filter(e => e.mood === 'neutral').length, color: '#f59e0b' },
                        { name: 'Bad', value: data.moodEntries.filter(e => e.mood === 'bad').length, color: '#ef4444' },
                        { name: 'Terrible', value: data.moodEntries.filter(e => e.mood === 'terrible').length, color: '#7c3aed' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mood Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Entries</span>
                    <Badge variant="secondary">{data.moodEntries.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Mood</span>
                    <Badge variant="secondary">
                      {data.moodEntries.length > 0 
                        ? moodScoreToLabel(data.moodEntries.reduce((sum, entry) => {
                            const scores = { terrible: 1, bad: 2, neutral: 3, good: 4, excellent: 5 };
                            return sum + scores[entry.mood];
                          }, 0) / data.moodEntries.length)
                        : 'No data'
                      }
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Most Common</span>
                    <Badge variant="secondary">
                      {data.moodEntries.length > 0 
                        ? (() => {
                            const counts = data.moodEntries.reduce((acc, entry) => {
                              acc[entry.mood] = (acc[entry.mood] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);
                            const mostCommon = Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b);
                            return mostCommon[0].charAt(0).toUpperCase() + mostCommon[0].slice(1);
                          })()
                        : 'No data'
                      }
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="study" className="space-y-6">
          {/* Study Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Study Time (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={studyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${Math.floor(value / 60)}h ${value % 60}m`, 'Study Time']}
                  />
                  <Bar dataKey="minutes" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Study Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Study Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Sessions</span>
                    <Badge variant="secondary">{data.studySessions.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Study Time</span>
                    <Badge variant="secondary">
                      {data.studySessions.length > 0 
                        ? `${Math.floor(data.studySessions.reduce((sum, session) => sum + session.duration, 0) / 60)}h ${data.studySessions.reduce((sum, session) => sum + session.duration, 0) % 60}m`
                        : '0h 0m'
                      }
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Session</span>
                    <Badge variant="secondary">
                      {data.studySessions.length > 0 
                        ? `${Math.floor(data.studySessions.reduce((sum, session) => sum + session.duration, 0) / data.studySessions.length)}m`
                        : '0m'
                      }
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Most Studied Subject</span>
                    <Badge variant="secondary">
                      {data.studySessions.length > 0 
                        ? (() => {
                            const subjectCounts = data.studySessions.reduce((acc, session) => {
                              acc[session.subject] = (acc[session.subject] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);
                            const mostStudied = Object.entries(subjectCounts).reduce((a, b) => subjectCounts[a[0]] > subjectCounts[b[0]] ? a : b);
                            return mostStudied[0];
                          })()
                        : 'No data'
                      }
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subject Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={(() => {
                        const subjectCounts = data.studySessions.reduce((acc, session) => {
                          acc[session.subject] = (acc[session.subject] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>);
                        return Object.entries(subjectCounts).map(([subject, count]) => ({
                          name: subject,
                          value: count
                        }));
                      })()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {(() => {
                        const subjectCounts = data.studySessions.reduce((acc, session) => {
                          acc[session.subject] = (acc[session.subject] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>);
                        const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000'];
                        return Object.entries(subjectCounts).map(([subject, count], index) => ({
                          name: subject,
                          value: count,
                          color: colors[index % colors.length]
                        }));
                      })().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
