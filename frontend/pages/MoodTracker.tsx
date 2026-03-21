
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area
} from 'recharts';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, Trash2, Smile, Frown, Meh, Heart, Star, TrendingUp, 
  Calendar, Clock, Activity, Brain, Target, AlertCircle, CheckCircle
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { moodAPI } from '@/services/api';

interface MoodEntry {
  _id: string;
  mood: 'terrible' | 'bad' | 'neutral' | 'good' | 'excellent';
  note: string;
  date: string;
}

interface MoodInsights {
  averageMood: number;
  moodTrend: 'improving' | 'declining' | 'stable';
  mostCommonMood: string;
  totalEntries: number;
  streakDays: number;
  weeklyPattern: string;
  recommendations: string[];
}

const MoodTracker = () => {
  const { currentUser } = useUser();
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tracker');

  // Form state
  const [formData, setFormData] = useState({
    mood: 'neutral' as MoodEntry['mood'],
    note: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const initializeMoodEntries = async () => {
      try {
        if (currentUser) {
          const apiEntries = await moodAPI.getAll();
          setMoodEntries(apiEntries);
          setApiAvailable(true);
        } else {
          const storedEntries = JSON.parse(localStorage.getItem('moodEntries') || '[]');
          setMoodEntries(storedEntries);
        }
      } catch (error) {
        console.error('Error loading mood entries:', error);
        const storedEntries = JSON.parse(localStorage.getItem('moodEntries') || '[]');
        setMoodEntries(storedEntries);
      } finally {
        setIsLoading(false);
      }
    };

    initializeMoodEntries();
  }, [currentUser]);

  const resetForm = () => {
    setFormData({
      mood: 'neutral',
      note: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleAddEntry = async () => {
    try {
      const newEntryData = {
        mood: formData.mood,
        note: formData.note,
        date: formData.date
      };

      if (currentUser) {
        const newEntry = await moodAPI.create(newEntryData);
        setMoodEntries([newEntry, ...moodEntries]);
      } else {
        // Save to localStorage
        const newEntry: MoodEntry = {
          _id: Date.now().toString(),
          ...newEntryData,
          date: new Date(formData.date).toISOString()
        };
        const updatedEntries = [newEntry, ...moodEntries];
        setMoodEntries(updatedEntries);
        localStorage.setItem('moodEntries', JSON.stringify(updatedEntries));
      }

      toast({
        title: "Mood recorded!",
        description: "Your mood has been saved successfully.",
      });
      
      resetForm();
      setIsAddingEntry(false);
    } catch (error) {
      console.error('Error adding mood entry:', error);
      toast({
        title: "Failed to record mood",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      if (currentUser) {
        await moodAPI.delete(id);
      }
      
      const updatedEntries = moodEntries.filter(entry => entry._id !== id);
      setMoodEntries(updatedEntries);
      localStorage.setItem('moodEntries', JSON.stringify(updatedEntries));
      
      toast({
        title: "Entry deleted",
        description: "Mood entry has been removed.",
      });
    } catch (error) {
      console.error('Error deleting mood entry:', error);
      toast({
        title: "Failed to delete entry",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const getMoodIcon = (mood: MoodEntry['mood']) => {
    switch (mood) {
      case 'excellent':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'good':
        return <Smile className="h-5 w-5 text-green-500" />;
      case 'neutral':
        return <Meh className="h-5 w-5 text-yellow-500" />;
      case 'bad':
        return <Frown className="h-5 w-5 text-orange-500" />;
      case 'terrible':
        return <Frown className="h-5 w-5 text-red-500" />;
      default:
        return <Meh className="h-5 w-5" />;
    }
  };

  const getMoodColor = (mood: MoodEntry['mood']) => {
    switch (mood) {
      case 'excellent':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'good':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'neutral':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'bad':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'terrible':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMoodLabel = (mood: MoodEntry['mood']) => {
    switch (mood) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'neutral':
        return 'Neutral';
      case 'bad':
        return 'Bad';
      case 'terrible':
        return 'Terrible';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAverageMood = () => {
    if (moodEntries.length === 0) return 0;
    
    const moodScores = { terrible: 1, bad: 2, neutral: 3, good: 4, excellent: 5 };
    const totalScore = moodEntries.reduce((sum, entry) => sum + moodScores[entry.mood], 0);
    return totalScore / moodEntries.length;
  };

  const calculateInsights = (): MoodInsights => {
    const averageMood = getAverageMood();
    
    // Calculate mood trend
    const recentEntries = moodEntries.slice(0, 7);
    const olderEntries = moodEntries.slice(7, 14);
    
    const recentAverage = recentEntries.length > 0 
      ? recentEntries.reduce((sum, entry) => {
          const scores = { terrible: 1, bad: 2, neutral: 3, good: 4, excellent: 5 };
          return sum + scores[entry.mood];
        }, 0) / recentEntries.length
      : 0;
    
    const olderAverage = olderEntries.length > 0
      ? olderEntries.reduce((sum, entry) => {
          const scores = { terrible: 1, bad: 2, neutral: 3, good: 4, excellent: 5 };
          return sum + scores[entry.mood];
        }, 0) / olderEntries.length
      : 0;
    
    let moodTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentEntries.length > 0 && olderEntries.length > 0) {
      if (recentAverage > olderAverage + 0.5) moodTrend = 'improving';
      else if (recentAverage < olderAverage - 0.5) moodTrend = 'declining';
    }
    
    // Find most common mood
    const moodCounts = moodEntries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const moodCountEntries = Object.entries(moodCounts);
    const mostCommonMood = moodCountEntries.length > 0
      ? moodCountEntries.reduce((a, b) => moodCounts[a[0]] > moodCounts[b[0]] ? a : b)[0]
      : 'neutral';
    
    // Calculate streak
    let streakDays = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateString = checkDate.toISOString().split('T')[0];
      const hasEntry = moodEntries.some(entry => entry.date.startsWith(dateString));
      if (hasEntry) {
        streakDays++;
      } else {
        break;
      }
    }
    
    // Weekly pattern analysis
    const dayOfWeekCounts = moodEntries.reduce((acc, entry) => {
      const day = new Date(entry.date).getDay();
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayEntries = Object.entries(dayOfWeekCounts);
    const weeklyPattern = dayEntries.length > 0
      ? days[parseInt(dayEntries.reduce((a, b) =>
          dayOfWeekCounts[parseInt(a[0])] > dayOfWeekCounts[parseInt(b[0])] ? a : b
        )[0])]
      : 'N/A';
    
    // Generate recommendations
    const recommendations = [];
    if (averageMood < 3) recommendations.push('Consider activities that boost your mood');
    if (streakDays < 3) recommendations.push('Try to track your mood more regularly');
    if (moodTrend === 'declining') recommendations.push('Focus on self-care and positive activities');
    if (recommendations.length === 0) recommendations.push('Keep up the great work!');
    
    return {
      averageMood,
      moodTrend,
      mostCommonMood: mostCommonMood.charAt(0).toUpperCase() + mostCommonMood.slice(1),
      totalEntries: moodEntries.length,
      streakDays,
      weeklyPattern,
      recommendations
    };
  };

  const insights = calculateInsights();

  const processMoodData = () => {
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
        : 0;

      return {
        day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
        score: averageScore,
        entries: dayEntries.length
      };
    });
  };

  const moodData = processMoodData();

  const moodDistribution = [
    { name: 'Excellent', value: moodEntries.filter(e => e.mood === 'excellent').length, color: '#10b981' },
    { name: 'Good', value: moodEntries.filter(e => e.mood === 'good').length, color: '#3b82f6' },
    { name: 'Neutral', value: moodEntries.filter(e => e.mood === 'neutral').length, color: '#f59e0b' },
    { name: 'Bad', value: moodEntries.filter(e => e.mood === 'bad').length, color: '#ef4444' },
    { name: 'Terrible', value: moodEntries.filter(e => e.mood === 'terrible').length, color: '#7c3aed' }
  ];

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading mood tracker...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="mb-8 animate-slide-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mood Tracker</h1>
            <p className="text-muted-foreground mt-1">
              Track your emotional well-being and discover patterns
            </p>
          </div>
          <Button onClick={() => setIsAddingEntry(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tracker">Mood Tracker</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tracker" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Mood</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.averageMood.toFixed(1)}/5</div>
                <Progress value={(insights.averageMood / 5) * 100} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {insights.averageMood >= 4 ? 'Great mood!' : insights.averageMood >= 3 ? 'Good mood' : 'Could be better'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.streakDays} days</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {insights.streakDays >= 7 ? 'Amazing consistency!' : 'Keep it up!'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.totalEntries}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {insights.totalEntries >= 30 ? 'Great tracking!' : 'More entries = better insights'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mood Trend</CardTitle>
                {insights.moodTrend === 'improving' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : insights.moodTrend === 'declining' ? (
                  <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                ) : (
                  <Activity className="h-4 w-4 text-blue-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  insights.moodTrend === 'improving' ? 'text-green-600' : 
                  insights.moodTrend === 'declining' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {insights.moodTrend.charAt(0).toUpperCase() + insights.moodTrend.slice(1)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Compared to previous week
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Mood Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {moodEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No mood entries yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start tracking your mood to see patterns and insights
                  </p>
                  <Button onClick={() => setIsAddingEntry(true)}>
                    Add Your First Entry
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {moodEntries.slice(0, 10).map((entry) => (
                    <div key={entry._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getMoodIcon(entry.mood)}
                        <div>
                          <div className="font-medium">{getMoodLabel(entry.mood)}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(entry.date)}
                          </div>
                          {entry.note && (
                            <div className="text-sm text-muted-foreground mt-1">
                              "{entry.note}"
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getMoodColor(entry.mood)}>
                          {getMoodLabel(entry.mood)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEntry(entry._id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Mood Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Mood Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Most Common Mood</span>
                    <Badge variant="secondary">{insights.mostCommonMood}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Most Active Day</span>
                    <Badge variant="secondary">{insights.weeklyPattern}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current Streak</span>
                    <Badge variant="secondary">{insights.streakDays} days</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Entries</span>
                    <Badge variant="secondary">{insights.totalEntries}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Star className="h-4 w-4 text-blue-500 mt-0.5" />
                      <span className="text-sm">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mood Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Mood Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={moodDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {moodDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
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
                  <YAxis domain={[0, 5]} />
                  <Tooltip 
                    formatter={(value: number) => [
                      value === 0 ? 'No entries' : `${value.toFixed(1)}/5`,
                      'Mood Score'
                    ]}
                    labelFormatter={(label) => `Day: ${label}`}
                  />
                  <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Weekly Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={moodData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Entries']}
                  />
                  <Bar dataKey="entries" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Entry Dialog */}
      <Dialog open={isAddingEntry} onOpenChange={setIsAddingEntry}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Mood Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <Label>How are you feeling?</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {(['terrible', 'bad', 'neutral', 'good', 'excellent'] as const).map((mood) => (
                  <Button
                    key={mood}
                    variant={formData.mood === mood ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                    onClick={() => setFormData({ ...formData, mood })}
                  >
                    {getMoodIcon(mood)}
                    <span className="text-xs">{getMoodLabel(mood)}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="note">Notes (optional)</Label>
              <Textarea
                id="note"
                placeholder="What's on your mind?"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleAddEntry} className="flex-1">
                Save Entry
              </Button>
              <Button variant="outline" onClick={() => setIsAddingEntry(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MoodTracker;
