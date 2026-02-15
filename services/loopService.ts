const LOOPS_API_URL = 'https://app.loops.so/api/v1';

export const loopService = {
    /**
     * Create a new contact in Loops.so
     * @param email User's email
     * @param userId User's ID from Supabase
     * @param firstName User's first name (optional, derived from username usually)
     * @param lastName User's last name (optional)
     * @param userType User type (e.g., 'user', 'owner') - helpful for segmentation
     */
    async createContact(email: string, userId: string, firstName?: string, lastName?: string, userType: string = 'user') {
        const apiKey = import.meta.env.VITE_LOOPS_API_KEY;

        if (!apiKey) {
            console.warn('[LoopService] No API key found. Skipping contact creation.');
            return;
        }

        try {
            const payload = {
                email: email,
                firstName: firstName,
                lastName: lastName,
                userGroup: userType, // Custom field in Loops for segmentation
                userId: userId, // Using standard naming convention if possible
                source: 'DripMap Web App'
            };

            const response = await fetch(`${LOOPS_API_URL}/contacts/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('[LoopService] Failed to create contact:', data);
                return { success: false, error: data };
            }

            console.log('[LoopService] Successfully created contact:', data);
            return { success: true, data };

        } catch (error) {
            console.error('[LoopService] Error creating contact:', error);
            return { success: false, error };
        }
    },

    /**
     * Send a custom event to Loops.so (e.g., specific triggers)
     */
    async sendEvent(email: string, eventName: string, eventProperties?: any) {
        const apiKey = import.meta.env.VITE_LOOPS_API_KEY;

        if (!apiKey) return;

        try {
            const response = await fetch(`${LOOPS_API_URL}/events/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    eventName: eventName,
                    ...eventProperties
                })
            });

            return await response.json();
        } catch (error) {
            console.error('[LoopService] Error sending event:', error);
        }
    },

    /**
     * Send a transactional email using Loops.so
     */
    async sendTransactionalEmail(
        email: string,
        transactionalId: string,
        dataVariables: any
    ) {
        const apiKey = import.meta.env.VITE_LOOPS_API_KEY;
        if (!apiKey) {
            console.warn('[LoopService] No API key for transactional email');
            return { success: false, error: 'No API Key' };
        }

        try {
            const response = await fetch(`${LOOPS_API_URL}/transactional/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    transactionalId: transactionalId,
                    dataVariables: dataVariables,
                    addToAudience: true // Optional: adds them to audience if not present
                })
            });

            const data = await response.json();
            if (!response.ok) {
                console.error('[LoopService] Transactional email failed:', data);
                return { success: false, error: data };
            }

            return { success: true, data };
        } catch (error) {
            console.error('[LoopService] Error sending transactional email:', error);
            return { success: false, error };
        }
    }
};
