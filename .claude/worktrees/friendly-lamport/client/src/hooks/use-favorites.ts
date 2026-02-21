import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getFavorites, addFavorite as addFavoriteAPI, removeFavorite as removeFavoriteAPI, getFrequentlyUsedContent, type FavoriteItem, type FrequentlyUsedItem } from "@/api/content";

export function useFavorites() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: favorites = [], isLoading, error, isError } = useQuery<FavoriteItem[]>({
    queryKey: ["favorites"],
    queryFn: getFavorites,
  });

  const addFavorite = useMutation({
    mutationFn: addFavoriteAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add to favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeFavorite = useMutation({
    mutationFn: removeFavoriteAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove from favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  const favoriteIds = new Set(favorites.map(f => f.contentId));

  const isFavorite = (contentId: string) => favoriteIds.has(contentId);

  const toggleFavorite = async (contentId: string) => {
    if (isFavorite(contentId)) {
      await removeFavorite.mutateAsync(contentId);
    } else {
      await addFavorite.mutateAsync(contentId);
    }
  };

  return {
    favorites,
    favoriteIds,
    isLoading,
    isError,
    error,
    isFavorite,
    toggleFavorite,
    addFavorite: addFavorite.mutate,
    removeFavorite: removeFavorite.mutate,
    isToggling: addFavorite.isPending || removeFavorite.isPending,
  };
}

export function useFrequentlyUsed(limit: number = 10) {
  return useQuery<FrequentlyUsedItem[]>({
    queryKey: ["frequently-used", limit],
    queryFn: () => getFrequentlyUsedContent(limit),
  });
}
