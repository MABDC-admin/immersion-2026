import { supabase } from '@/integrations/supabase/client';

export const sendOnboardingEmail = async (
    email: string,
    firstName: string,
    lastName: string,
    startDate?: string,
    password?: string
) => {
    const { data, error } = await supabase.functions.invoke('send-onboarding-email', {
        body: {
            to: email,
            firstName,
            lastName,
            startDate,
            type: startDate ? 'approval' : 'onboarding',
            username: email,
            password,
        },
    });

    if (error) {
        console.error('Error sending onboarding email:', error);
        throw error;
    }

    return data;
};
