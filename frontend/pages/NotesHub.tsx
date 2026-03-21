
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Filter, 
  Plus, 
  ThumbsUp, 
  MessageSquare, 
  Download, 
  Share2,
  X,
  RefreshCw
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { cn } from '@/lib/utils';
import { getNotes, createNote, getMyNotes, getGlobalNotes } from '@/services/noteService';
import { getComments, addComment, deleteComment, type Comment as CommentType } from '@/services/commentService';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { sanitizeNoteContent, sanitizeText } from '@/utils/sanitize';

import { toast } from '@/hooks/use-toast';

// Types for our notes

interface Note {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  privacy: 'private' | 'global';
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  comments: number;
  downloads: number;
  likedBy?: string[]; // Array of user IDs who liked the note
}

// Sample categories
const categories = [
  'All',
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Business',
  'Economics',
  'Psychology',
  'Literature',
  'History'
];

// Empty initial notes - Notes will be loaded from localStorage or API
const mockNotes: Note[] = [];

const NotesHub = () => {
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'global' | 'my-notes'>('global');
  const [comments, setComments] = useState<Record<string, CommentType[]>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [dataSource, setDataSource] = useState<'server' | 'cache'>('server');
  
  // New note form state with persistence
  const [newNote, setNewNote, clearNewNote] = useFormPersistence({
    key: 'note_form',
    initialValue: {
      title: '',
      description: '',
      content: '',
      category: 'Computer Science',
      tags: '',
      privacy: 'private' as 'private' | 'global'
    }
  });

  // Load notes from API
  useEffect(() => {
    const loadNotes = async () => {
      setIsLoading(true);
      try {
        let apiNotes: Note[] = [];
        
        // Check if user is authenticated for private notes
        if (viewMode === 'my-notes') {
          if (!currentUser) {
            toast({
              title: "Authentication required",
              description: "Please log in to view your private notes",
              variant: "destructive"
            });
            setNotes([]);
            setIsLoading(false);
            return;
          }
          
          // Load user's private notes
          apiNotes = await getMyNotes();
        } else {
          // Load global notes (no authentication required)
          apiNotes = await getGlobalNotes();
        }
        
        // Always use API data if available, regardless of length
        setNotes(apiNotes);
        setDataSource('server');
        
        // Also save to localStorage as backup
        const storageKey = viewMode === 'my-notes' ? 'my_notes' : 'global_notes';
        localStorage.setItem(storageKey, JSON.stringify(apiNotes));
        
      } catch (error) {
        console.error('Failed to fetch notes:', error);
        
        // Check if it's an authentication error
        if (error instanceof Error && error.message.includes('Authentication')) {
          toast({
            title: "Authentication required",
            description: "Please log in to access your notes",
            variant: "destructive"
          });
          setNotes([]);
                  } else {
            toast({
              title: "Failed to load notes",
              description: "Using cached data. Some features may be limited.",
              variant: "destructive"
            });
            // Load from localStorage as fallback
            const storageKey = viewMode === 'my-notes' ? 'my_notes' : 'global_notes';
            const storedNotes = localStorage.getItem(storageKey);
            if (storedNotes) {
              const parsedNotes = JSON.parse(storedNotes);
              const notesWithDates = parsedNotes.map((note: Partial<Note> & { createdAt: string; updatedAt: string }) => ({
                ...note,
                createdAt: new Date(note.createdAt),
                updatedAt: new Date(note.updatedAt)
              } as Note));
              setNotes(notesWithDates);
              setDataSource('cache');
            } else {
              setNotes([]);
              setDataSource('server');
            }
          }
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, [currentUser, viewMode]);
  
  // Filter notes based on category
  useEffect(() => {
    let filtered = [...notes];
    
    // Filter by view mode
    if (currentUser && viewMode === 'my-notes') {
      filtered = filtered.filter(note => note.author.id === currentUser.id);
    }
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(note => note.category === selectedCategory);
    }
    
    setFilteredNotes(filtered);
  }, [selectedCategory, notes, viewMode, currentUser]);
  
  const handleCreateNote = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (!newNote.title || !newNote.description || !newNote.content) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Sanitize note content
    const sanitizedNote = {
      ...newNote,
      title: sanitizeText(newNote.title),
      description: sanitizeText(newNote.description),
      content: sanitizeNoteContent(newNote.content)
    };
    
    // Create note with API
    const createdNote = await createNote(sanitizedNote);
    
    if (createdNote) {
      // Note was created via API - update state
      setNotes([createdNote, ...notes]);
      
      // Also update localStorage for the appropriate view
      const storageKey = createdNote.privacy === 'private' ? 'my_notes' : 'global_notes';
      const currentStoredNotes = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updatedStoredNotes = [createdNote, ...currentStoredNotes];
      localStorage.setItem(storageKey, JSON.stringify(updatedStoredNotes));
      
      toast({
        title: "Success!",
        description: "Note created successfully"
      });
    } else {
      // API failed - show error
      toast({
        title: "Failed to create note",
        description: "Please try again later",
        variant: "destructive"
      });
    }
    
    setIsCreatingNote(false);
    // Reset form
    clearNewNote();
  };
  
  const formatDate = (date: Date) => {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Handle like/unlike a note
  const handleLikeNote = async (noteId: string) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Optimistic update
    const updatedNotes = notes.map(note => {
      if (note.id === noteId) {
        const likedBy = note.likedBy || [];
        const isLiked = likedBy.includes(currentUser.id);
        return {
          ...note,
          likes: isLiked ? note.likes - 1 : note.likes + 1,
          likedBy: isLiked
            ? likedBy.filter(id => id !== currentUser.id)
            : [...likedBy, currentUser.id]
        };
      }
      return note;
    });
    setNotes(updatedNotes);

    // Persist to API
    try {
      const { likeNote } = await import('@/services/noteService');
      await likeNote(noteId);
    } catch (error) {
      // Revert optimistic update on failure
      setNotes(notes);
      toast({ title: "Failed to like note", description: "Please try again.", variant: "destructive" });
    }
  };

  // Handle adding a comment
  const handleAddComment = async (noteId: string, commentContent: string) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!commentContent.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a comment.",
        variant: "destructive"
      });
      return;
    }

    const newComment = await addComment(noteId, commentContent);
    
    if (newComment) {
      // Update comments for this note
      const currentComments = comments[noteId] || [];
      const updatedComments = [newComment, ...currentComments];
      setComments(prev => ({ ...prev, [noteId]: updatedComments }));

      // Update note comment count
      const updatedNotes = notes.map(note => {
        if (note.id === noteId) {
          return { ...note, comments: note.comments + 1 };
        }
        return note;
      });
      setNotes(updatedNotes);

      // Clear comment input
      setCommentInputs(prev => ({ ...prev, [noteId]: '' }));
    }
  };

  // Get comments for a note
  const getCommentsForNote = (noteId: string): CommentType[] => {
    return comments[noteId] || [];
  };

  const loadCommentsForNote = async (noteId: string) => {
    if (!comments[noteId]) {
      const fetchedComments = await getComments(noteId);
      setComments(prev => ({ ...prev, [noteId]: fetchedComments }));
    }
  };

  const toggleComments = async (noteId: string) => {
    if (!showComments[noteId]) {
      await loadCommentsForNote(noteId);
    }
    setShowComments(prev => ({ ...prev, [noteId]: !prev[noteId] }));
  };

  const handleDownloadNote = (note: Note) => {
    // Create a downloadable text file
    const content = `Title: ${note.title}
Description: ${note.description}
Category: ${note.category}
Tags: ${note.tags.join(', ')}
Author: ${note.author.name}
Created: ${formatDate(note.createdAt)}

Content:
${note.content}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Update download count locally
    const updatedNotes = notes.map(n => 
      n.id === note.id ? { ...n, downloads: n.downloads + 1 } : n
    );
    setNotes(updatedNotes);

    toast({
      title: "Note downloaded",
      description: "The note has been downloaded successfully",
    });
  };

  const refreshNotes = async () => {
    setIsLoading(true);
    try {
      let apiNotes: Note[] = [];
      
      if (viewMode === 'my-notes') {
        if (!currentUser) {
          toast({
            title: "Authentication required",
            description: "Please log in to view your private notes",
            variant: "destructive"
          });
          setNotes([]);
          return;
        }
        apiNotes = await getMyNotes();
      } else {
        apiNotes = await getGlobalNotes();
      }
      
      setNotes(apiNotes);
      
      // Update localStorage
      const storageKey = viewMode === 'my-notes' ? 'my_notes' : 'global_notes';
      localStorage.setItem(storageKey, JSON.stringify(apiNotes));
      
      toast({
        title: "Notes refreshed",
        description: "Latest notes loaded from server",
      });
    } catch (error) {
      console.error('Failed to refresh notes:', error);
      toast({
        title: "Failed to refresh notes",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };


  
  return (
    <div className="page-container">
      <header className="mb-8 animate-slide-in">
        <h1 className="text-3xl font-bold tracking-tight">
          {currentUser && viewMode === 'my-notes' ? `${currentUser.name}'s Notes` : 'Global Notes Hub'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {currentUser && viewMode === 'my-notes'
            ? 'Your personal collection of study notes and resources'
            : 'Share and discover study notes from students around the world. Contribute your knowledge to help others learn!'
          }
        </p>
        {dataSource === 'cache' && (
          <p className="text-xs text-orange-500 mt-1">
            ⚠️ Showing cached data. Click refresh to get latest notes.
          </p>
        )}
      </header>
      

      
      {/* View Mode Toggle */}
      {currentUser && (
        <div className="flex justify-center mb-6">
          <div className="bg-muted rounded-lg p-1 flex">
            <button
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                viewMode === 'global'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setViewMode('global')}
            >
              Global Notes
            </button>
            <button
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                viewMode === 'my-notes'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setViewMode('my-notes')}
            >
              My Notes
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex gap-2">
          <div className="relative">
            <select
              className="hub-input appearance-none pr-8"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <Filter className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          
          <button
            className="hub-button flex items-center gap-2"
            onClick={() => currentUser ? setIsCreatingNote(true) : navigate('/login')}
          >
            <Plus className="h-4 w-4" />
            Add Note
          </button>
          
          <button
            className="hub-button flex items-center gap-2"
            onClick={refreshNotes}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
      
      {/* Create Note Form */}
      {isCreatingNote && (
        <div className="hub-card p-6 mb-8 animate-scale-in">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Create New Note</h2>
            <button
              className="hub-icon-button p-1"
              onClick={() => setIsCreatingNote(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                className="hub-input"
                value={newNote.title}
                onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                placeholder="e.g., Data Structures and Algorithms"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                className="hub-input"
                value={newNote.description}
                onChange={(e) => setNewNote({...newNote, description: e.target.value})}
                placeholder="Brief description of your notes"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Content</label>
              <textarea
                className="hub-input min-h-[200px]"
                value={newNote.content}
                onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                placeholder="Full content of your notes..."
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  className="hub-input"
                  value={newNote.category}
                  onChange={(e) => setNewNote({...newNote, category: e.target.value})}
                >
                  {categories.filter(c => c !== 'All').map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <input
                  type="text"
                  className="hub-input"
                  value={newNote.tags}
                  onChange={(e) => setNewNote({...newNote, tags: e.target.value})}
                  placeholder="e.g., algorithms, sorting, data structures"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Privacy</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={newNote.privacy === 'private'}
                    onChange={(e) => setNewNote({...newNote, privacy: e.target.value as 'private' | 'global'})}
                    className="text-primary"
                  />
                  <span className="text-sm">Private (Only you can see)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="privacy"
                    value="global"
                    checked={newNote.privacy === 'global'}
                    onChange={(e) => setNewNote({...newNote, privacy: e.target.value as 'private' | 'global'})}
                    className="text-primary"
                  />
                  <span className="text-sm">Global (Visible to everyone)</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <button
                className="hub-button sentience-button-outline mr-2"
                onClick={() => setIsCreatingNote(false)}
              >
                Cancel
              </button>
              <button
                className="hub-button"
                onClick={handleCreateNote}
              >
                Create Note
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-pulse flex flex-col items-center">
            <RefreshCw className="h-12 w-12 text-muted-foreground/30 mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading notes from server...</p>
          </div>
        </div>
      )}
      
      {/* Notes grid */}
      {!isLoading && filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="hub-card group overflow-hidden hover:transform hover:scale-[1.02] transition-all"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-1">
                    <Link to={`/notes/${note.id}`}>
                      <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {note.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {note.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 my-3">
                  <span className="hub-tag bg-primary/10 text-primary">
                    {note.category}
                  </span>
                  {note.tags.slice(0, 3).map((tag, index) => (
                    <span 
                      key={index} 
                      className="hub-tag bg-muted text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="hub-tag bg-muted text-muted-foreground">
                      +{note.tags.length - 3}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <img 
                      src={note.author.avatar} 
                      alt={note.author.name} 
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm font-medium">{note.author.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(note.createdAt)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLikeNote(note.id);
                      }}
                      className={`flex items-center text-xs transition-colors ${
                        currentUser && note.likedBy?.includes(currentUser.id)
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-primary'
                      }`}
                    >
                      <ThumbsUp className={`h-3.5 w-3.5 mr-1 ${
                        currentUser && note.likedBy?.includes(currentUser.id)
                          ? 'fill-current'
                          : ''
                      }`} />
                      {note.likes}
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleComments(note.id);
                      }}
                      className="flex items-center text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1" />
                      {note.comments}
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDownloadNote(note);
                      }}
                      className="flex items-center text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      {note.downloads}
                    </button>
                  </div>
                  <Share2 className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                {/* Comments Section */}
                {showComments[note.id] && (
                  <div className="border-t border-border pt-4 mt-4">
                    <div className="space-y-3">
                      {/* Comment Input */}
                      {currentUser && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={commentInputs[note.id] || ''}
                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [note.id]: e.target.value }))}
                            className="flex-1 hub-input text-sm"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && commentInputs[note.id]?.trim()) {
                                handleAddComment(note.id, commentInputs[note.id] || '');
                              }
                            }}
                          />
                          <button
                            onClick={() => handleAddComment(note.id, commentInputs[note.id] || '')}
                            disabled={!commentInputs[note.id]?.trim()}
                            className="hub-button text-sm px-3 py-1 disabled:opacity-50"
                          >
                            Add
                          </button>
                        </div>
                      )}
                      
                      {/* Comments List */}
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {getCommentsForNote(note.id).map((comment) => (
                          <div key={comment.id} className="flex gap-2 p-2 bg-muted/30 rounded-md">
                            <img 
                              src={comment.author.avatar} 
                              alt={comment.author.name} 
                              className="w-6 h-6 rounded-full flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">{comment.author.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(comment.createdAt)}
                                </span>
                                {currentUser?.id === comment.author.id && (
                                  <button
                                    onClick={async () => {
                                      const ok = await deleteComment(comment.id);
                                      if (ok) {
                                        setComments(prev => ({
                                          ...prev,
                                          [noteId]: (prev[noteId] || []).filter(c => c.id !== comment.id)
                                        }));
                                        setNotes(prev => prev.map(n =>
                                          n.id === noteId ? { ...n, comments: n.comments - 1 } : n
                                        ));
                                      }
                                    }}
                                    className="text-xs text-red-500 hover:text-red-700"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                              <p className="text-xs mt-1">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                        {getCommentsForNote(note.id).length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            No comments yet. Be the first to comment!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : !isLoading ? (
        <div className="hub-card p-8 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-medium mb-2">
            {selectedCategory !== 'All' ? "No notes found" : "No notes yet"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {selectedCategory !== 'All'
              ? "Try adjusting your category filters"
              : currentUser && viewMode === 'my-notes'
                ? "Start creating your first study note to organize your learning"
                : "Be the first to contribute study notes to the global community!"
            }
          </p>
          <button
            className="hub-button mx-auto flex items-center gap-2"
            onClick={() => currentUser ? setIsCreatingNote(true) : navigate('/login')}
          >
            <Plus className="h-4 w-4" />
            {currentUser && viewMode === 'my-notes' ? "Create Your First Note" : currentUser ? "Share Your First Note" : "Add Note"}
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default NotesHub;
