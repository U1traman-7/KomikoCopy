import { PostHog } from 'posthog-node'

let posthogClient: PostHog | null = null

// Initialize PostHog client
export const getPostHogClient = (): PostHog => {
  // Disable PostHog in local development
  if (process.env.NODE_ENV === 'development') {
    // Return a mock client that does nothing
    if (!posthogClient) {
      posthogClient = {
        capture: () => {},
        identify: () => {},
        flush: async () => {},
        shutdown: async () => {},
      } as any as PostHog
    }
    return posthogClient
  }

  if (!posthogClient) {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!posthogKey) {
      throw new Error(
        'NEXT_PUBLIC_POSTHOG_KEY is not set in environment variables.',
      )
    }

    posthogClient = new PostHog(posthogKey, {
      host: 'https://us.i.posthog.com',
      flushAt: 10, 
      flushInterval: 5000, // Flush every 5 seconds
    })
  }
  return posthogClient
}

// Server-side event tracking function
export const trackServerEvent = async (
  eventName: string,
  userId: string,
  properties?: Record<string, any>,
) => {
  try {
    const client = getPostHogClient()
    client.capture({
      distinctId: userId,
      event: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        source: 'server',
      },
    })

    // Ensure events are sent
    await client.flush()
  } catch (error) {
    console.error('Error tracking server event:', error)
  }
}

// Set user properties
export const setServerUserProperties = async (
  userId: string,
  properties: Record<string, any>,
) => {
  try {
    const client = getPostHogClient()
    client.identify({
      distinctId: userId,
      properties,
    })

    await client.flush()
  } catch (error) {
    console.error('Error setting user properties:', error)
  }
}

// Server-side event constants
export const SERVER_EVENTS = {
  PAYMENT_INITIATED: 'payment_initiated',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  ONE_TIME_PURCHASE_COMPLETED: 'one_time_purchase_completed',
  PAYMENT_COMPLETED: 'payment_completed',
} as const

// Track subscription started
export const trackSubscriptionStarted = async (
  userId: string,
  plan: string,
  amount: number,
  billingCycle: 'monthly' | 'annual',
  currency: string = 'USD',
) => {
  await trackServerEvent(SERVER_EVENTS.SUBSCRIPTION_STARTED, userId, {
    plan,
    amount,
    billing_cycle: billingCycle,
    currency,
  })

  // Update user properties
  await setServerUserProperties(userId, {
    plan,
    subscription_status: 'active',
    user_segment: 'paying_user',
  })
}

// Track subscription renewed (repurchase)
export const trackSubscriptionRenewed = async (
  userId: string,
  plan: string,
  amount: number,
  billingCycle: 'monthly' | 'annual',
  currency: string = 'USD',
) => {
  await trackServerEvent(SERVER_EVENTS.SUBSCRIPTION_RENEWED, userId, {
    plan,
    amount,
    billing_cycle: billingCycle,
    currency,
  })

  // Update user properties
  await setServerUserProperties(userId, {
    plan,
    subscription_status: 'active',
    user_segment: 'retained_user',
  })
}

// Track subscription cancelled
export const trackSubscriptionCancelled = async (
  userId: string,
  plan: string,
  reason?: string,
) => {
  await trackServerEvent(SERVER_EVENTS.SUBSCRIPTION_CANCELLED, userId, {
    plan,
    reason,
  })

  // Update user properties
  await setServerUserProperties(userId, {
    subscription_status: 'cancelled',
    user_segment: 'churned_user',
  })
}

// Track payment initiated (server-side)
export const trackPaymentInitiatedServer = async (
  userId: string,
  planOrPackage: string,
  currency: string = 'USD',
  paymentMethod: string = 'stripe',
) => {
  await trackServerEvent(SERVER_EVENTS.PAYMENT_INITIATED, userId, {
    plan: planOrPackage,
    currency,
    payment_method: paymentMethod,
  });
};

// Track one-time purchase completed
export const trackOneTimePurchaseCompleted = async (
  userId: string,
  packageType: string,
  amount: number,
  credits: number,
  currency: string = 'USD',
) => {
  await trackServerEvent(SERVER_EVENTS.ONE_TIME_PURCHASE_COMPLETED, userId, {
    package_type: packageType,
    amount,
    credits_purchased: credits,
    currency,
  })
}

// Track payment completed
export const trackPaymentCompleted = async (
  userId: string,
  plan: string,
  amount: number,
  paymentMethod: string,
  currency: string = 'USD',
) => {
  await trackServerEvent(SERVER_EVENTS.PAYMENT_COMPLETED, userId, {
    plan,
    amount,
    payment_method: paymentMethod,
    currency,
  })
}

// Close PostHog client (call on app shutdown)
export const closePostHogClient = async () => {
  if (posthogClient) {
    await posthogClient.shutdown()
    posthogClient = null
  }
} 