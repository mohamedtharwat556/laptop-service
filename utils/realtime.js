const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for real-time
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not found. Real-time features will be disabled.');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Subscribe to request updates
 * @param {function} callback - Function to call when updates occur
 * @returns {object} - Subscription object
 */
function subscribeToRequests(callback) {
    if (!supabase) {
        console.warn('Real-time not available');
        return null;
    }

    try {
        const subscription = supabase
            .channel('requests-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'requests'
                },
                (payload) => {
                    console.log('Request update received:', payload);
                    callback(payload);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Successfully subscribed to requests updates');
                } else if (status === 'CLOSED') {
                    console.log('Subscription closed');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('Subscription error');
                }
            });

        return subscription;
    } catch (error) {
        console.error('Error subscribing to requests:', error);
        return null;
    }
}

/**
 * Subscribe to user updates
 * @param {function} callback - Function to call when updates occur
 * @returns {object} - Subscription object
 */
function subscribeToUsers(callback) {
    if (!supabase) {
        console.warn('Real-time not available');
        return null;
    }

    try {
        const subscription = supabase
            .channel('users-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'users'
                },
                (payload) => {
                    console.log('User update received:', payload);
                    callback(payload);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Successfully subscribed to users updates');
                }
            });

        return subscription;
    } catch (error) {
        console.error('Error subscribing to users:', error);
        return null;
    }
}

/**
 * Subscribe to order updates
 * @param {function} callback - Function to call when updates occur
 * @returns {object} - Subscription object
 */
function subscribeToOrders(callback) {
    if (!supabase) {
        console.warn('Real-time not available');
        return null;
    }

    try {
        const subscription = supabase
            .channel('orders-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders'
                },
                (payload) => {
                    console.log('Order update received:', payload);
                    callback(payload);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Successfully subscribed to orders updates');
                }
            });

        return subscription;
    } catch (error) {
        console.error('Error subscribing to orders:', error);
        return null;
    }
}

/**
 * Unsubscribe from a channel
 * @param {object} subscription - Subscription object to unsubscribe
 */
function unsubscribe(subscription) {
    if (subscription) {
        supabase.removeChannel(subscription);
        console.log('Unsubscribed from channel');
    }
}

/**
 * Broadcast a message to all connected clients
 * @param {string} channel - Channel name
 * @param {object} message - Message to broadcast
 */
async function broadcast(channel, message) {
    if (!supabase) {
        console.warn('Real-time not available');
        return;
    }

    try {
        await supabase.channel(channel).send({
            type: 'broadcast',
            event: 'message',
            payload: message
        });
    } catch (error) {
        console.error('Error broadcasting message:', error);
    }
}

/**
 * Listen for broadcast messages
 * @param {string} channel - Channel name
 * @param {function} callback - Function to call when message received
 * @returns {object} - Subscription object
 */
function listenToBroadcast(channel, callback) {
    if (!supabase) {
        console.warn('Real-time not available');
        return null;
    }

    try {
        const subscription = supabase
            .channel(channel)
            .on('broadcast', { event: 'message' }, (payload) => {
                console.log('Broadcast received:', payload);
                callback(payload);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Successfully listening to ${channel} broadcasts`);
                }
            });

        return subscription;
    } catch (error) {
        console.error('Error listening to broadcasts:', error);
        return null;
    }
}

module.exports = {
    subscribeToRequests,
    subscribeToUsers,
    subscribeToOrders,
    unsubscribe,
    broadcast,
    listenToBroadcast
};
