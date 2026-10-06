import { supabase } from '../lib/supabase';

export const loopService = {
    /**
     * Create a new contact in Loops.so
     */
    async createContact(email: string, userId: string, firstName?: string, lastName?: string, userType: string = 'user') {
        try {
            const payload = {
                email: email,
                firstName: firstName,
                lastName: lastName,
                userGroup: userType,
                userId: userId,
                source: 'DripMap Web App'
            };

            const { data, error } = await supabase.functions.invoke('loops-proxy', {
                body: { endpoint: '/contacts/create', payload }
            });

            if (error) throw error;
            console.log('[LoopService] Successfully created contact:', data);
            return { success: true, data };
        } catch (error: any) {
            console.error('[LoopService] Error creating contact:', error);
            return { success: false, error: error.message || String(error) };
        }
    },

    /**
     * Send a custom event to Loops.so (e.g., specific triggers)
     */
    async sendEvent(email: string, eventName: string, eventProperties?: any) {
        try {
            const payload = {
                email: email,
                eventName: eventName,
                ...eventProperties
            };

            const { data, error } = await supabase.functions.invoke('loops-proxy', {
                body: { endpoint: '/events/send', payload }
            });

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error('[LoopService] Error sending event:', error);
            return { success: false, error: error.message || String(error) };
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
        try {
            const payload = {
                email: email,
                transactionalId: transactionalId,
                dataVariables: dataVariables,
                addToAudience: true
            };

            const { data, error } = await supabase.functions.invoke('loops-proxy', {
                body: { endpoint: '/transactional', payload }
            });

            if (error) throw error;
            return { success: true, data };
        } catch (error: any) {
            console.error('[LoopService] Error sending transactional email:', error);
            return { success: false, error: error.message || String(error) };
        }
    }
};
