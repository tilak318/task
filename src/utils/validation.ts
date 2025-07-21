// Simple validation utility for React Native (Zod-like patterns)
// Since Zod requires Node.js environment, we'll create a lightweight validation system

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ValidationSchema {
  private rules: Record<string, ValidationRule> = {};

  required(field: string): this {
    if (!this.rules[field]) this.rules[field] = {};
    this.rules[field].required = true;
    return this;
  }

  minLength(field: string, length: number): this {
    if (!this.rules[field]) this.rules[field] = {};
    this.rules[field].minLength = length;
    return this;
  }

  maxLength(field: string, length: number): this {
    if (!this.rules[field]) this.rules[field] = {};
    this.rules[field].maxLength = length;
    return this;
  }

  pattern(field: string, regex: RegExp, message?: string): this {
    if (!this.rules[field]) this.rules[field] = {};
    this.rules[field].pattern = regex;
    return this;
  }

  custom(field: string, validator: (value: any) => string | null): this {
    if (!this.rules[field]) this.rules[field] = {};
    this.rules[field].custom = validator;
    return this;
  }

  validate(data: Record<string, any>): ValidationResult {
    const errors: string[] = [];

    for (const [field, rule] of Object.entries(this.rules)) {
      const value = data[field];

      // Required validation
      if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        errors.push(`${field} is required`);
        continue;
      }

      // Skip other validations if value is empty and not required
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        continue;
      }

      // Min length validation
      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        errors.push(`${field} must be at least ${rule.minLength} characters`);
      }

      // Max length validation
      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        errors.push(`${field} must be no more than ${rule.maxLength} characters`);
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) {
          errors.push(customError);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Predefined validation schemas
export const taskValidation = new ValidationSchema()
  .required('title')
  .minLength('title', 3)
  .maxLength('title', 100)
  .required('assigneeId')
  .required('dueDate')
  .custom('dueDate', (value) => {
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      return 'Due date cannot be in the past';
    }
    return null;
  });

export const userValidation = new ValidationSchema()
  .required('name')
  .minLength('name', 2)
  .maxLength('name', 50)
  .required('username')
  .minLength('username', 3)
  .maxLength('username', 30)
  .pattern('username', /^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
  .required('role')
  .custom('role', (value) => {
    const validRoles = ['member', 'manager', 'hod', 'admin', 'super_admin'];
    if (!validRoles.includes(value)) {
      return 'Invalid role selected';
    }
    return null;
  });

export const departmentValidation = new ValidationSchema()
  .required('name')
  .minLength('name', 2)
  .maxLength('name', 50)
  .maxLength('description', 200)
  .custom('code', (value) => {
    if (value && !/^[A-Z0-9]{2,10}$/.test(value)) {
      return 'Department code must be 2-10 uppercase letters and numbers';
    }
    return null;
  });

export const loginValidation = new ValidationSchema()
  .required('username')
  .minLength('username', 3)
  .required('password')
  .minLength('password', 6);

// Utility functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

export const validateDate = (date: string): boolean => {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Field-specific validators
export const fieldValidators = {
  email: (value: string) => {
    if (!value) return null;
    return validateEmail(value) ? null : 'Invalid email format';
  },
  
  phone: (value: string) => {
    if (!value) return null;
    return validatePhone(value) ? null : 'Invalid phone number format';
  },
  
  date: (value: string) => {
    if (!value) return null;
    return validateDate(value) ? null : 'Invalid date format';
  },
  
  url: (value: string) => {
    if (!value) return null;
    return validateUrl(value) ? null : 'Invalid URL format';
  },
  
  positiveNumber: (value: number) => {
    if (value === undefined || value === null) return null;
    return value > 0 ? null : 'Must be a positive number';
  },
  
  futureDate: (value: string) => {
    if (!value) return null;
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return date > today ? null : 'Date must be in the future';
  }
}; 