import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log('Missing env variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateTask() {
    console.log('Authenticating as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@mabdc.com', // Assuming this is an admin email. We might need a real one.
        password: 'password123', // I don't know the password. I will use service role key instead.
    });
}

testCreateTask();
