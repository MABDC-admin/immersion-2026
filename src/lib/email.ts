export const sendOnboardingEmail = async (
    email: string,
    firstName: string,
    lastName: string,
    startDate?: string
) => {
    const { data, error } = await (window as any).supabase.functions.invoke('send-onboarding-email', {
        body: {
            to: email,
            firstName,
            lastName,
            startDate,
            type: startDate ? 'approval' : 'onboarding',
        },
    });

    if (error) {
        console.error('Error sending onboarding email:', error);
        throw error;
    }

    return data;
};
