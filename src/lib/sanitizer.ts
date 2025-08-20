import DOMPurify from 'dompurify';

export class InputSanitizer {
  static sanitizeHtml(input: string): string {
    if (!input) return '';
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  }
  
  static sanitizeText(input: string): string {
    if (!input) return '';
    return input
      .replace(/[<>]/g, '') // Remove basic HTML chars
      .trim()
      .slice(0, 1000); // Limit length
  }
  
  static sanitizeEmail(input: string): string {
    if (!input) return '';
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9@._-]/g, '');
  }
  
  static sanitizeFormData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string') {
        if (key.includes('email')) {
          sanitized[key] = this.sanitizeEmail(value);
        } else if (key.includes('html') || key.includes('description')) {
          sanitized[key] = this.sanitizeHtml(value);
        } else {
          sanitized[key] = this.sanitizeText(value);
        }
      } else {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  }
}