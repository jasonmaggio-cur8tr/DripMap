/**
 * Validates that required environment variables are set
 * @returns Object with validation status and missing variables
 */
export const validateEnv = (): { 
  isValid: boolean; 
  missing: string[];
  warnings: string[];
} => {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Required for production
  // @ts-ignore - Vite env vars
  const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
  // @ts-ignore - Vite env vars
  const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl === 'your-supabase-url-here') {
    missing.push('VITE_SUPABASE_URL');
  }

  if (!supabaseKey || supabaseKey === 'your-supabase-anon-key-here') {
    missing.push('VITE_SUPABASE_ANON_KEY');
  }

  // Optional but recommended
  // @ts-ignore - Vite env vars
  const geminiKey = import.meta.env?.GEMINI_API_KEY;
  if (!geminiKey || geminiKey === 'your-gemini-api-key-here') {
    warnings.push('GEMINI_API_KEY (Gemini AI) - AI features will be disabled');
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings
  };
};

/**
 * Gets the appropriate error message for missing env vars
 */
export const getEnvErrorMessage = (validation: ReturnType<typeof validateEnv>): string => {
  if (validation.isValid) return '';

  let message = '⚠️ Missing required environment variables:\n\n';
  validation.missing.forEach(v => {
    message += `- ${v}\n`;
  });

  message += '\nPlease update your .env file with valid Supabase credentials.';
  
  if (validation.warnings.length > 0) {
    message += '\n\n⚡ Optional variables:\n';
    validation.warnings.forEach(w => {
      message += `- ${w}\n`;
    });
  }

  return message;
};
