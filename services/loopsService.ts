// Loops.so Email Integration Service
// API Docs: https://loops.so/docs/api

const LOOPS_API_KEY = import.meta.env.VITE_LOOPS_API_KEY || '';
const LOOPS_API_URL = 'https://app.loops.so/api/v1';

interface LoopsContact {
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  userGroup?: 'user' | 'owner' | 'admin';
  source?: string;
}

interface TransactionalEmailData {
  transactionalId: string;
  email: string;
  dataVariables?: Record<string, string>;
}

// Add or update a contact in Loops
export const createOrUpdateContact = async (contact: LoopsContact): Promise<boolean> => {
  try {
    const response = await fetch(`${LOOPS_API_URL}/contacts/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: contact.email,
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        username: contact.username || '',
        userGroup: contact.userGroup || 'user',
        source: contact.source || 'dripmap_app',
      }),
    });

    if (!response.ok) {
      console.error('Failed to create/update contact:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Loops.so contact error:', error);
    return false;
  }
};

// Send a transactional email
export const sendTransactionalEmail = async (data: TransactionalEmailData): Promise<boolean> => {
  try {
    const response = await fetch(`${LOOPS_API_URL}/transactional`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionalId: data.transactionalId,
        email: data.email,
        dataVariables: data.dataVariables || {},
      }),
    });

    if (!response.ok) {
      console.error('Failed to send transactional email:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Loops.so transactional email error:', error);
    return false;
  }
};

// Send event to trigger automation
export const sendEvent = async (email: string, eventName: string, properties?: Record<string, string>): Promise<boolean> => {
  try {
    const response = await fetch(`${LOOPS_API_URL}/events/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        eventName,
        eventProperties: properties || {},
      }),
    });

    if (!response.ok) {
      console.error('Failed to send event:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Loops.so event error:', error);
    return false;
  }
};

// =====================================================
// DripMap Specific Email Functions
// =====================================================

// Call this when a new user signs up
export const onUserSignup = async (email: string, username: string): Promise<void> => {
  // Add contact to Loops
  await createOrUpdateContact({
    email,
    username,
    userGroup: 'user',
    source: 'signup',
  });

  // Trigger signup event (will send welcome email if automation is set up)
  await sendEvent(email, 'user_signup', { username });
};

// Call this when a shop owner claims their shop
export const onShopClaimed = async (ownerEmail: string, shopName: string): Promise<void> => {
  await createOrUpdateContact({
    email: ownerEmail,
    userGroup: 'owner',
    source: 'shop_claim',
  });

  await sendEvent(ownerEmail, 'shop_claimed', { shopName });
};

// Call this when someone comments on a shop (notify owner)
export const onNewComment = async (
  ownerEmail: string,
  shopName: string,
  commenterName: string,
  commentPreview: string
): Promise<void> => {
  await sendEvent(ownerEmail, 'new_comment', {
    shopName,
    commenterName,
    commentPreview: commentPreview.substring(0, 100),
  });
};

// Call this when a shop gets a new review
export const onNewReview = async (
  ownerEmail: string,
  shopName: string,
  reviewerName: string,
  rating: string
): Promise<void> => {
  await sendEvent(ownerEmail, 'new_review', {
    shopName,
    reviewerName,
    rating,
  });
};

// Call this when someone joins DripClub
export const onDripClubJoin = async (email: string, username: string): Promise<void> => {
  await createOrUpdateContact({
    email,
    username,
    userGroup: 'user',
    source: 'dripclub',
  });

  await sendEvent(email, 'dripclub_joined', { username });
};
