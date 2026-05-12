import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FamilyCareCard, CareReportRow, CardFormData, NewCareReportRow } from "@/types/careCard";
import { toast } from "sonner";

export function useCareCards() {
  const queryClient = useQueryClient();

  const cardsQuery = useQuery({
    queryKey: ["care-cards"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("family_care_cards")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as FamilyCareCard[];
    },
  });

  const createCardMutation = useMutation({
    mutationFn: async (cardData: CardFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Anda harus login terlebih dahulu");

      const { data, error } = await supabase
        .from("family_care_cards")
        .insert({ ...cardData, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data as FamilyCareCard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["care-cards"] });
      toast.success("Kartu berhasil disimpan");
    },
    onError: (error) => {
      toast.error("Gagal menyimpan kartu: " + error.message);
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: async ({ id, ...cardData }: CardFormData & { id: string }) => {
      const { data, error } = await supabase
        .from("family_care_cards")
        .update(cardData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as FamilyCareCard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["care-cards"] });
      toast.success("Kartu berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui kartu: " + error.message);
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("family_care_cards")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["care-cards"] });
      toast.success("Kartu berhasil dihapus");
    },
    onError: (error) => {
      toast.error("Gagal menghapus kartu: " + error.message);
    },
  });

  return {
    cards: cardsQuery.data ?? [],
    isLoading: cardsQuery.isLoading,
    error: cardsQuery.error,
    createCard: createCardMutation.mutateAsync,
    updateCard: updateCardMutation.mutateAsync,
    deleteCard: deleteCardMutation.mutateAsync,
    isCreating: createCardMutation.isPending,
    isUpdating: updateCardMutation.isPending,
    isDeleting: deleteCardMutation.isPending,
  };
}

export function useCareCard(cardId: string | undefined) {
  return useQuery({
    queryKey: ["care-card", cardId],
    queryFn: async () => {
      if (!cardId) return null;
      const { data, error } = await supabase
        .from("family_care_cards")
        .select("*")
        .eq("id", cardId)
        .single();
      
      if (error) throw error;
      return data as FamilyCareCard;
    },
    enabled: !!cardId,
  });
}

export function useCareReportRows(cardId: string | undefined) {
  const queryClient = useQueryClient();

  const rowsQuery = useQuery({
    queryKey: ["care-report-rows", cardId],
    queryFn: async () => {
      if (!cardId) return [];
      const { data, error } = await supabase
        .from("care_report_rows")
        .select("*")
        .eq("card_id", cardId)
        .order("tanggal", { ascending: true });
      
      if (error) throw error;
      return data as CareReportRow[];
    },
    enabled: !!cardId,
  });

  const createRowMutation = useMutation({
    mutationFn: async (rowData: NewCareReportRow) => {
      const { data, error } = await supabase
        .from("care_report_rows")
        .insert(rowData)
        .select()
        .single();
      
      if (error) throw error;
      return data as CareReportRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["care-report-rows", cardId] });
      toast.success("Baris laporan ditambahkan");
    },
    onError: (error) => {
      toast.error("Gagal menambah baris: " + error.message);
    },
  });

  const updateRowMutation = useMutation({
    mutationFn: async ({ id, ...rowData }: Partial<CareReportRow> & { id: string }) => {
      const { data, error } = await supabase
        .from("care_report_rows")
        .update(rowData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as CareReportRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["care-report-rows", cardId] });
      toast.success("Baris berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui baris: " + error.message);
    },
  });

  const deleteRowMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("care_report_rows")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["care-report-rows", cardId] });
      toast.success("Baris berhasil dihapus");
    },
    onError: (error) => {
      toast.error("Gagal menghapus baris: " + error.message);
    },
  });

  return {
    rows: rowsQuery.data ?? [],
    isLoading: rowsQuery.isLoading,
    error: rowsQuery.error,
    createRow: createRowMutation.mutateAsync,
    updateRow: updateRowMutation.mutateAsync,
    deleteRow: deleteRowMutation.mutateAsync,
    isCreating: createRowMutation.isPending,
    isUpdating: updateRowMutation.isPending,
    isDeleting: deleteRowMutation.isPending,
  };
}
