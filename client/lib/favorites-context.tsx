import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Favorite, favoritesApi } from './api';
import { useAuth } from './auth-context';

export type FavoriteItemType = 'destination' | 'service' | 'event' | 'investment' | 'product';

type FavoritesContextType = {
  favorites: Favorite[];
  isLoading: boolean;
  isFavorite: (itemType: FavoriteItemType, itemId: string) => boolean;
  toggleFavorite: (itemType: FavoriteItemType, itemId: string) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshFavorites = useCallback(async () => {
    if (!token || !user) {
      setFavorites([]);
      return;
    }
    try {
      setIsLoading(true);
      const data = await favoritesApi.list(token);
      setFavorites(data);
    } catch (err) {
      console.warn('Failed to load favorites:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const isFavorite = useCallback(
    (itemType: FavoriteItemType, itemId: string) => {
      return favorites.some((f) => f.itemType === itemType && f.itemId === itemId);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (itemType: FavoriteItemType, itemId: string) => {
      if (!token) return false;

      const currentlyFav = favorites.some((f) => f.itemType === itemType && f.itemId === itemId);

      // Optimistic update
      if (currentlyFav) {
        setFavorites((prev) => prev.filter((f) => !(f.itemType === itemType && f.itemId === itemId)));
        try {
          await favoritesApi.removeByItem(token, itemType, itemId);
          return false;
        } catch (err) {
          console.error('Failed to remove favorite:', err);
          refreshFavorites();
          return true;
        }
      } else {
        const tempFav: Favorite = {
          id: `temp-${Date.now()}`,
          userId: user?.id || '',
          itemType,
          itemId,
          createdAt: new Date().toISOString(),
        };
        setFavorites((prev) => [...prev, tempFav]);
        try {
          const added = await favoritesApi.add(token, itemType, itemId);
          setFavorites((prev) =>
            prev.map((f) => (f.id === tempFav.id ? added : f))
          );
          return true;
        } catch (err) {
          console.error('Failed to add favorite:', err);
          refreshFavorites();
          return false;
        }
      }
    },
    [token, user, favorites, refreshFavorites]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isLoading,
        isFavorite,
        toggleFavorite,
        refreshFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
