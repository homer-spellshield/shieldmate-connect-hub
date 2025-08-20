import { toast } from "@/hooks/use-toast";

export interface AppError {
  message: string;
  code?: string;
  details?: any;
}

export class AppErrorHandler {
  static handle(error: any, context?: string): AppError {
    console.error(context ? `Error in ${context}:` : 'Error:', error);
    
    let message = 'An unexpected error occurred';
    let code = 'UNKNOWN_ERROR';
    
    if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }
    
    // Handle specific Supabase errors
    if (error?.name === 'AuthError') {
      code = 'AUTH_ERROR';
      message = 'Authentication error. Please log in again.';
    } else if (error?.code === 'PGRST116') {
      code = 'NOT_FOUND';
      message = 'The requested resource was not found.';
    } else if (error?.code?.startsWith('23')) {
      code = 'DATABASE_CONSTRAINT';
      message = 'This operation violates database constraints.';
    }
    
    return { message, code, details: error };
  }
  
  static showToast(error: any, context?: string) {
    const appError = this.handle(error, context);
    
    toast({
      title: "Error",
      description: appError.message,
      variant: "destructive",
    });
    
    return appError;
  }
  
  static async handleAsync<T>(
    operation: () => Promise<T>, 
    context?: string,
    showToast: boolean = true
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      if (showToast) {
        this.showToast(error, context);
      } else {
        this.handle(error, context);
      }
      return null;
    }
  }
}