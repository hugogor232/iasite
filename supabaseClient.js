import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://ctyucywdaeahfivkxjpt.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0eXVjeXdkYWVhaGZpdmt4anB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDMwMTMsImV4cCI6MjA3OTk3OTAxM30.T9_8bS-QDA76MqN8RpzT-1xCXUycsDj2O2mK4o26Gew'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)