import { toast } from '@/hooks/use-toast';
import { sanitizeCommentContent } from '@/utils/sanitize';
import { API_BASE_URL } from '@/config';

export interface Comment {
  id: string;
  note: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: Date;
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

export const getComments = async (noteId: string): Promise<Comment[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/comments/${noteId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const comments = await response.json();
    return comments.map((comment: Record<string, unknown>) => ({
      id: comment._id || comment.id,
      note: comment.note,
      content: comment.content,
      author: {
        id: comment.author?.id || comment.authorId,
        name: comment.author?.name || 'Anonymous',
        avatar: comment.author?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Default'
      },
      createdAt: new Date(comment.createdAt)
    }));
  } catch (error) {
    console.error('Error fetching comments:', error);
    toast({
      title: "Failed to load comments",
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: "destructive"
    });
    return [];
  }
};

export const addComment = async (noteId: string, content: string): Promise<Comment | null> => {
  // Sanitize comment content
  const sanitizedContent = sanitizeCommentContent(content);
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/comments/${noteId}`, {
      method: 'POST',
      body: JSON.stringify({ content: sanitizedContent }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const comment = await response.json();

    toast({
      title: "Comment added",
      description: "Your comment has been added successfully",
    });

    return {
      id: comment._id || comment.id,
      note: comment.note,
      content: comment.content,
      author: {
        id: comment.author?.id || comment.authorId,
        name: comment.author?.name || 'Anonymous',
        avatar: comment.author?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Default'
      },
      createdAt: new Date(comment.createdAt)
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    toast({
      title: "Failed to add comment",
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: "destructive"
    });
    return null;
  }
};

export const deleteComment = async (commentId: string): Promise<boolean> => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    toast({
      title: "Comment deleted",
      description: "Your comment has been deleted successfully",
    });

    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    toast({
      title: "Failed to delete comment",
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: "destructive"
    });
    return false;
  }
}; 