
import { toast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://sentience.onrender.com/api';

export interface Note {
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
}

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });
};

export const getNotes = async (): Promise<Note[]> => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/notes`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const notes = await response.json();
    return notes.map((note: Record<string, unknown>) => ({
      id: note._id || note.id,
      title: note.title,
      description: note.description,
      content: note.content,
      category: note.category,
      tags: note.tags || [],
      privacy: note.privacy || 'private',
      author: {
        id: note.author?.id || note.user || note.userId,
        name: note.author?.name || note.authorName || 'Anonymous',
        avatar: note.author?.avatar || note.authorAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Default'
      },
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
      likes: note.likes || 0,
      comments: note.comments || 0,
      downloads: note.downloads || 0
    }));
  } catch (error) {
    console.error('Error fetching notes:', error);
    toast({
      title: "Failed to load notes",
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: "destructive"
    });
    return [];
  }
};

export const getMyNotes = async (): Promise<Note[]> => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/notes/my-notes`);
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const notes = await response.json();
    return notes.map((note: Record<string, unknown>) => ({
      id: note._id || note.id,
      title: note.title,
      description: note.description,
      content: note.content,
      category: note.category,
      tags: note.tags || [],
      privacy: note.privacy || 'private',
      author: {
        id: note.author?.id || note.user || note.userId,
        name: note.author?.name || note.authorName || 'Anonymous',
        avatar: note.author?.avatar || note.authorAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Default'
      },
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
      likes: note.likes || 0,
      comments: note.comments || 0,
      downloads: note.downloads || 0
    }));
  } catch (error) {
    console.error('Error fetching my notes:', error);
    toast({
      title: "Failed to load your notes",
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: "destructive"
    });
    return [];
  }
};

export const getGlobalNotes = async (): Promise<Note[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/notes/global`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const notes = await response.json();
    
    const mappedNotes = notes.map((note: Record<string, unknown>) => ({
      id: note._id || note.id,
      title: note.title,
      description: note.description,
      content: note.content,
      category: note.category,
      tags: note.tags || [],
      privacy: note.privacy || 'global',
      author: {
        id: note.author?.id || note.user || note.userId,
        name: note.author?.name || note.authorName || 'Anonymous',
        avatar: note.author?.avatar || note.authorAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Default'
      },
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
      likes: note.likes || 0,
      comments: note.comments || 0,
      downloads: note.downloads || 0
    }));
    
    return mappedNotes;
  } catch (error) {
    console.error('Error fetching global notes:', error);
    toast({
      title: "Failed to load global notes",
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: "destructive"
    });
    return [];
  }
};

export const getNote = async (noteId: string): Promise<Note | null> => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/notes/${noteId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const note = await response.json();
    return {
      id: note._id || note.id,
      title: note.title,
      description: note.description,
      content: note.content,
      category: note.category,
      tags: note.tags || [],
      author: {
        id: note.user || note.userId,
        name: note.authorName || 'Anonymous',
        avatar: note.authorAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Default'
      },
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
      likes: note.likes || 0,
      comments: note.comments || 0,
      downloads: note.downloads || 0
    };
  } catch (error) {
    console.error('Error fetching note:', error);
    toast({
      title: "Failed to load note",
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: "destructive"
    });
    return null;
  }
};

export const createNote = async (noteData: {
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string;
  privacy: 'private' | 'global';
}): Promise<Note | null> => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/notes`, {
      method: 'POST',
      body: JSON.stringify({
        title: noteData.title,
        description: noteData.description,
        content: noteData.content,
        category: noteData.category,
        privacy: noteData.privacy,
        tags: noteData.tags,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const note = await response.json();

    toast({
      title: "Success!",
      description: "Note created successfully",
    });

    return {
      id: note._id || note.id,
      title: note.title,
      description: note.description,
      content: note.content,
      category: note.category,
      tags: note.tags || [],
      author: {
        id: note.user || note.userId,
        name: note.authorName || 'Anonymous',
        avatar: note.authorAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Default'
      },
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
      likes: note.likes || 0,
      comments: note.comments || 0,
      downloads: note.downloads || 0
    };
  } catch (error) {
    console.error('Error creating note:', error);
    toast({
      title: "Failed to create note",
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: "destructive"
    });
    return null;
  }
};

export const updateNote = async (
  noteId: string,
  noteData: Partial<{
    title: string;
    description: string;
    content: string;
    category: string;
    tags: string;
  }>
): Promise<Note | null> => {
  try {
    const updateData: Record<string, unknown> = {};
    
    if (noteData.title !== undefined) updateData.title = noteData.title;
    if (noteData.description !== undefined) updateData.description = noteData.description;
    if (noteData.content !== undefined) updateData.content = noteData.content;
    if (noteData.category !== undefined) updateData.category = noteData.category;
    if (noteData.tags !== undefined) {
      updateData.tags = noteData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }

    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const note = await response.json();

    toast({
      title: "Success!",
      description: "Note updated successfully",
    });

    return {
      id: note._id || note.id,
      title: note.title,
      description: note.description,
      content: note.content,
      category: note.category,
      tags: note.tags || [],
      author: {
        id: note.user || note.userId,
        name: note.authorName || 'Anonymous',
        avatar: note.authorAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Default'
      },
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
      likes: note.likes || 0,
      comments: note.comments || 0,
      downloads: note.downloads || 0
    };
  } catch (error) {
    console.error('Error updating note:', error);
    toast({
      title: "Failed to update note",
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: "destructive"
    });
    return null;
  }
};

export const likeNote = async (noteId: string): Promise<Note | null> => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/notes/like/${noteId}`, {
      method: 'PUT',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const note = await response.json();

    return {
      id: note._id || note.id,
      title: note.title,
      description: note.description,
      content: note.content,
      category: note.category,
      tags: note.tags || [],
      author: {
        id: note.user || note.userId,
        name: note.authorName || 'Anonymous',
        avatar: note.authorAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Default'
      },
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
      likes: note.likes || 0,
      comments: note.comments || 0,
      downloads: note.downloads || 0
    };
  } catch (error) {
    console.error('Error liking note:', error);
    toast({
      title: "Failed to like note",
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: "destructive"
    });
    return null;
  }
};

export const deleteNote = async (noteId: string): Promise<boolean> => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/notes/${noteId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    toast({
      title: "Success!",
      description: "Note deleted successfully",
    });

    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    toast({
      title: "Failed to delete note",
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: "destructive"
    });
    return false;
  }
};
