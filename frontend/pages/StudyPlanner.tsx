
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Clock, BookOpen, Calendar } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { studyAPI } from '@/services/api';

interface StudySession {
  _id: string;
  subject: string;
  date: string;
  startTime: string;
  duration: number; // in minutes
  notes: string;
}

const StudyPlanner = () => {
  const { currentUser } = useUser();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    duration: '',
    notes: ''
  });

  useEffect(() => {
    const initializeSessions = async () => {
      try {
        if (currentUser) {
          const apiSessions = await studyAPI.getAll();
          setSessions(apiSessions);
        } else {
          const storedSessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
          setSessions(storedSessions);
        }
      } catch (error) {
        console.error('Error loading study sessions:', error);
        const storedSessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
        setSessions(storedSessions);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSessions();
  }, [currentUser]);

  const resetForm = () => {
    setFormData({
      subject: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      duration: '',
      notes: ''
    });
  };

  const handleAddSession = async () => {
    if (!formData.subject.trim() || !formData.startTime || !formData.duration) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    try {
      const newSessionData = {
        subject: formData.subject,
        date: formData.date,
        startTime: formData.startTime,
        duration: parseInt(formData.duration),
        notes: formData.notes
      };

      if (currentUser) {
        const newSession = await studyAPI.create(newSessionData);
        setSessions([newSession, ...sessions]);
      } else {
        // Save to localStorage
        const newSession: StudySession = {
          _id: Date.now().toString(),
          ...newSessionData,
          date: new Date(formData.date).toISOString()
        };
        const updatedSessions = [newSession, ...sessions];
        setSessions(updatedSessions);
        localStorage.setItem('studySessions', JSON.stringify(updatedSessions));
      }

      toast({
        title: "Session added!",
        description: "Study session has been saved successfully.",
      });

      resetForm();
      setIsAddingSession(false);
    } catch (error) {
      console.error('Error creating study session:', error);
      toast({
        title: "Error",
        description: "Failed to save study session. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateSession = async (id: string, updatedData: Partial<StudySession>) => {
    try {
      if (currentUser) {
        const updatedSession = await studyAPI.update(id, updatedData);
        setSessions(sessions.map(session => session._id === id ? updatedSession : session));
      } else {
        // Update localStorage
        const updatedSessions = sessions.map(session => 
          session._id === id 
            ? { ...session, ...updatedData }
            : session
        );
        setSessions(updatedSessions);
        localStorage.setItem('studySessions', JSON.stringify(updatedSessions));
      }

      toast({
        title: "Session updated!",
        description: "Study session has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating study session:', error);
      toast({
        title: "Error",
        description: "Failed to update study session. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      if (currentUser) {
        await studyAPI.delete(id);
        setSessions(sessions.filter(session => session._id !== id));
      } else {
        // Delete from localStorage
        const updatedSessions = sessions.filter(session => session._id !== id);
        setSessions(updatedSessions);
        localStorage.setItem('studySessions', JSON.stringify(updatedSessions));
      }

      toast({
        title: "Session deleted",
        description: "Study session has been removed.",
      });
    } catch (error) {
      console.error('Error deleting study session:', error);
      toast({
        title: "Error",
        description: "Failed to delete study session. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTotalStudyTime = () => {
    return sessions.reduce((total, session) => total + session.duration, 0);
  };

  const getTodayStudyTime = () => {
    const today = new Date().toISOString().split('T')[0];
    return sessions
      .filter(session => session.date === today)
      .reduce((total, session) => total + session.duration, 0);
  };

  const getSubjectStats = () => {
    const stats: { [key: string]: number } = {};
    sessions.forEach(session => {
      stats[session.subject] = (stats[session.subject] || 0) + session.duration;
    });
    return stats;
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading study sessions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="mb-8 animate-slide-in">
        <h1 className="text-3xl font-bold tracking-tight">Study Planner</h1>
        <p className="text-muted-foreground mt-1">
          Track your study sessions and monitor your learning progress
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Badge variant="secondary">{sessions.length}</Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
            <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
            <Badge variant="outline">{formatTime(getTotalStudyTime())}</Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
            <CardTitle className="text-sm font-medium">Today's Study Time</CardTitle>
            <Badge variant="outline">{formatTime(getTodayStudyTime())}</Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <Badge variant="outline">{Object.keys(getSubjectStats()).length}</Badge>
          </CardHeader>
        </Card>
      </div>

      {/* Add Session Button */}
      <div className="mb-6">
        <Dialog open={isAddingSession} onOpenChange={setIsAddingSession}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Study Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Study Session</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Mathematics, Physics"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="60"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="What did you study? Any important points?"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddingSession(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSession}>
                Add Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Study Sessions List */}
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-muted-foreground text-center">
                <p className="text-lg font-medium mb-2">No study sessions yet</p>
                <p className="text-sm">Start tracking your study sessions to monitor your progress!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card key={session._id} className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">{session.subject}</h3>
                      <Badge variant="outline">{formatTime(session.duration)}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(session.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{session.startTime}</span>
                      </div>
                    </div>
                    {session.notes && (
                      <p className="text-sm text-muted-foreground">{session.notes}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateSession(session._id, { duration: session.duration + 30 })}
                      className="hover:bg-primary/10 hover:border-primary/30"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      +30m
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSession(session._id)}
                      className="hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default StudyPlanner;
