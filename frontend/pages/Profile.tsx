
import React, { useState, useEffect } from 'react';
import { User, Pencil, BookOpen, LogOut, Save, X, Download, Upload, Trash2, Database, AlertTriangle, GraduationCap, Calendar, MapPin } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/utils/avatar';
import { dataSyncService } from '@/services/dataSync';
import { toast } from '@/hooks/use-toast';

const universityOptions = [
  'Tech University',
  'Central College',
  'State University',
  'Liberal Arts College',
  'Community College',
  'City University'
];

const majorOptions = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Business',
  'Economics',
  'Psychology',
  'Literature',
  'History',
  'Arts',
  'Engineering'
];

const yearOptions = ['1st', '2nd', '3rd', '4th', '5th', 'Graduate'];

const Profile = () => {
  const { currentUser, logout, updateProfile } = useUser();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 0, percentage: 0 });
  
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    university: currentUser?.university || '',
    major: currentUser?.major || '',
    year: currentUser?.year || '',
    bio: currentUser?.bio || '',
    gender: currentUser?.gender || 'neutral',
    avatar: currentUser?.avatar || '',
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file (JPEG, PNG, etc).",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          const base64String = canvas.toDataURL('image/jpeg', 0.8);
          setFormData(prev => ({ ...prev, avatar: base64String }));
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Update storage usage
  useEffect(() => {
    setStorageUsage(dataSyncService.getStorageUsage());
  }, []);
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const handleSaveProfile = () => {
    if (!currentUser) return;
    
    let finalAvatar = formData.avatar;
    
    const isDiceBear = finalAvatar.includes('api.dicebear.com');
    if (isDiceBear || !finalAvatar) {
      function getAvgMoodForAvatar() {
        try {
          const moods: { mood: string }[] = JSON.parse(localStorage.getItem('moodEntries') || '[]');
          if (!moods.length) return 'neutral';
          const moodMap = { terrible: 1, bad: 2, neutral: 3, good: 4, excellent: 5 };
          const avg = moods.reduce((sum, m) => sum + (moodMap[m.mood] || 3), 0) / moods.length;
          if (avg <= 1.5) return 'terrible';
          if (avg <= 2.5) return 'bad';
          if (avg <= 3.5) return 'neutral';
          if (avg <= 4.5) return 'good';
          return 'excellent';
        } catch { return 'neutral'; }
      }
      finalAvatar = getAvatarUrl(formData.gender, getAvgMoodForAvatar());
    }
    
    updateProfile({ ...formData, avatar: finalAvatar });
    setIsEditing(false);
  };

  const handleExportData = () => {
    dataSyncService.downloadData();
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (dataSyncService.importData(data)) {
          setStorageUsage(dataSyncService.getStorageUsage());
        }
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Invalid file format. Please select a valid backup file.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all your data? This action cannot be undone.')) {
      dataSyncService.clearAllData();
      setStorageUsage(dataSyncService.getStorageUsage());
      toast({
        title: "Data cleared",
        description: "All your data has been cleared successfully.",
      });
    }
  };
  
  // Show loading state while redirecting
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="sentience-card p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-6"></div>
            <p className="text-muted-foreground text-lg">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-2">
            <div className="sentience-card p-8 animate-fade-in-up">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Profile
                  </h1>
                  <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105",
                    isEditing 
                      ? "text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/20" 
                      : "text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20"
                  )}
                >
                  {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              <div className="flex flex-col lg:flex-row items-start space-y-6 lg:space-y-0 lg:space-x-8">
                <div className="flex-shrink-0">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/70 rounded-full blur-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <img
                      src={isEditing ? formData.avatar : currentUser.avatar}
                      alt={currentUser.name}
                      className="relative w-32 h-32 rounded-full border-4 border-background shadow-xl transition-transform duration-200 group-hover:scale-105 object-cover"
                    />
                    {isEditing ? (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg cursor-pointer z-10 pt-0.5"
                        title="Change Profile Picture"
                      >
                        <Upload className="h-4 w-4" />
                        <input 
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                      </button>
                    ) : (
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 space-y-6">
                  {isEditing ? (
                    <div className="space-y-6 animate-fade-in-scale">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">Full Name</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="Enter your full name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">Gender</label>
                          <select
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          >
                            <option value="neutral">Prefer not to say</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">University</label>
                        <div className="relative">
                          <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <select
                            value={formData.university}
                            onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          >
                            <option value="">Select University</option>
                            {universityOptions.map((university) => (
                              <option key={university} value={university}>
                                {university}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">Major</label>
                          <select
                            value={formData.major}
                            onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          >
                            <option value="">Select Major</option>
                            {majorOptions.map((major) => (
                              <option key={major} value={major}>
                                {major}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">Year</label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <select
                              value={formData.year}
                              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            >
                              <option value="">Select Year</option>
                              {yearOptions.map((year) => (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Bio</label>
                        <textarea
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                          placeholder="Tell us about yourself, your interests, and goals..."
                        />
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleSaveProfile}
                          className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                        >
                          <Save className="h-4 w-4" />
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-fade-in-up">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">{currentUser.name}</h2>
                        <p className="text-muted-foreground text-lg">{currentUser.email}</p>
                      </div>
                      
                      {currentUser.university && (
                        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                          <GraduationCap className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium text-foreground">{currentUser.university}</p>
                            <p className="text-sm text-muted-foreground">
                              {currentUser.major} • {currentUser.year}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {currentUser.bio && (
                        <div className="p-4 bg-muted/20 rounded-lg border-l-4 border-primary/30">
                          <p className="text-foreground leading-relaxed">{currentUser.bio}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="sentience-card p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  to="/tasks"
                  className="flex items-center gap-3 p-4 text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 transform hover:scale-105 group"
                >
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">View Tasks</span>
                </Link>
                <Link
                  to="/notes"
                  className="flex items-center gap-3 p-4 text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 transform hover:scale-105 group"
                >
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">View Notes</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 p-4 text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200 transform hover:scale-105 w-full group"
                >
                  <div className="p-2 bg-destructive/10 rounded-lg group-hover:bg-destructive/20 transition-colors">
                    <LogOut className="h-4 w-4 text-destructive" />
                  </div>
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>

            {/* Data Management */}
            <div className="sentience-card p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Data Management
              </h3>
              <div className="space-y-4">
                <button
                  onClick={() => setShowDataManagement(!showDataManagement)}
                  className="flex items-center gap-3 p-4 text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 transform hover:scale-105 w-full group"
                >
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Database className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">Data Settings</span>
                </button>
                
                {showDataManagement && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg animate-fade-in-scale">
                    {/* Storage Usage */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">Storage Usage</span>
                        <span className="text-sm font-bold text-primary">{Math.round(storageUsage.percentage)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                        <div 
                          className={cn(
                            "h-3 rounded-full transition-all duration-500 ease-out",
                            storageUsage.percentage > 80 ? "bg-gradient-to-r from-red-500 to-red-600" : 
                            storageUsage.percentage > 60 ? "bg-gradient-to-r from-yellow-500 to-yellow-600" : 
                            "bg-gradient-to-r from-green-500 to-green-600"
                          )}
                          style={{ width: `${storageUsage.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {storageUsage.used}MB used of {storageUsage.total}MB
                      </p>
                    </div>

                    {/* Data Actions */}
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <button
                        onClick={handleExportData}
                        className="flex items-center gap-2 w-full p-3 text-sm text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 transform hover:scale-105 group"
                      >
                        <Download className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                        Export Data
                      </button>
                      
                      <label className="flex items-center gap-2 w-full p-3 text-sm text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 transform hover:scale-105 cursor-pointer group">
                        <Upload className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                        Import Data
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportData}
                          className="hidden"
                        />
                      </label>
                      
                      <button
                        onClick={handleClearData}
                        className="flex items-center gap-2 w-full p-3 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200 transform hover:scale-105 group"
                      >
                        <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        Clear All Data
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Storage Warning */}
            {storageUsage.percentage > 80 && (
              <div className="sentience-card p-6 border-l-4 border-yellow-500 bg-yellow-500/10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Storage Warning</span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300/80 leading-relaxed">
                  Your storage is almost full. Consider exporting and clearing old data to free up space.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
