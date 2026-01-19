import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Favorite {
  contentId: string;
  title: string;
  createdAt: string;
}

export function useFavorites() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: favorites = [], isLoading, error, isError } = useQuery<Favorite[]>({
    queryKey: ["favorites"],
    queryFn: async () => {
      const res = await fetch("/api/favorites", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch favorites");
      return res.json();
    },
  });

  const addFavorite = useMutation({
    mutationFn: async (contentId: string) => {
      const res = await fetch(`/api/favorites/${contentId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add favorite");
      return res.json();
    },
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
    mutationFn: async (contentId: string) => {
      const res = await fetch(`/api/favorites/${contentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove favorite");
      return res.json();
    },
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
  return useQuery<Array<{ contentId: string; title: string; sendCount: number }>>({
    queryKey: ["frequently-used", limit],
    queryFn: async () => {
      const res = await fetch(`/api/content/frequently-used?limit=${limit}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch frequently used");
      return res.json();
    },
  });
}
