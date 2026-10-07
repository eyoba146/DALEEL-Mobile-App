import React, { createContext, useContext, useState, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, type } from '../theme/tokens';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ message: string; title?: string; type: ToastType } | null>(null);
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const timerRef = useRef<any>(null);

  const showToast = (message: string, type: ToastType = 'info', title?: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, title, type });

    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 60,
      useNativeDriver: true,
    }).start();

    timerRef.current = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -140,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setToast(null));
    }, 3200);
  };

  const success = (message: string, title?: string) => showToast(message, 'success', title);
  const error = (message: string, title?: string) => showToast(message, 'error', title);

  return (
    <ToastContext.Provider value={{ showToast, success, error }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              top: Math.max(insets.top, 16) + 8,
              transform: [{ translateY: slideAnim }],
            },
          ]}
          pointerEvents="none"
        >
          <View
            style={[
              styles.toastBox,
              toast.type === 'success' && styles.toastSuccess,
              toast.type === 'error' && styles.toastError,
              toast.type === 'info' && styles.toastInfo,
            ]}
          >
            <Ionicons
              name={
                toast.type === 'success'
                  ? 'checkmark-circle'
                  : toast.type === 'error'
                    ? 'alert-circle'
                    : 'information-circle'
              }
              size={20}
              color={
                toast.type === 'success'
                  ? colors.success
                  : toast.type === 'error'
                    ? colors.error
                    : colors.info
              }
            />
            <View style={styles.textWrap}>
              {toast.title && <Text style={styles.toastTitle}>{toast.title}</Text>}
              <Text style={styles.toastMessage} numberOfLines={2}>
                {toast.message}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export function useAdminToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useAdminToast must be used within a ToastProvider');
  }
  return context;
}

export const useToast = useAdminToast;

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastBox: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...shadow.modal,
  },
  toastSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    backgroundColor: '#FFFFFF',
  },
  toastError: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    backgroundColor: '#FFFFFF',
  },
  toastInfo: {
    borderLeftWidth: 4,
    borderLeftColor: colors.navy,
    backgroundColor: '#FFFFFF',
  },
  textWrap: {
    flex: 1,
  },
  toastTitle: {
    ...type.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  toastMessage: {
    ...type.bodySmall,
    color: colors.textSecondary,
    fontSize: 13,
  },
});
