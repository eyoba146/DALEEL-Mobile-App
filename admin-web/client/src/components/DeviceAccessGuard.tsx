import React from 'react';
import { useDeviceAccess } from '../context/DeviceAccessContext';
import { DeviceRestrictionScreen } from './DeviceRestrictionScreen';

interface DeviceAccessGuardProps {
  children: React.ReactNode;
}

/**
 * Reusable DeviceAccessGuard
 *
 * Ensures that children (protected portal components) are only mounted and rendered
 * if the device access policy permits the current device, orientation, and viewport width.
 * Prevents any brief rendering of protected UI before initial checks complete.
 */
export const DeviceAccessGuard: React.FC<DeviceAccessGuardProps> = ({ children }) => {
  const { evaluation, reevaluate } = useDeviceAccess();

  if (!evaluation.allowed) {
    return <DeviceRestrictionScreen evaluation={evaluation} onReevaluate={reevaluate} />;
  }

  return <>{children}</>;
};
