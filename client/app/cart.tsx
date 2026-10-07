import { Redirect } from 'expo-router';
import React from 'react';

/**
 * Approved DALEEL MVP Scope:
 * E-commerce cart/checkout transactions are handled via direct artisan order inquiry
 * on the artisan product screen. This route safely redirects users to the artisan marketplace.
 */
export default function CartScreen() {
  return <Redirect href="/marketplace" />;
}
