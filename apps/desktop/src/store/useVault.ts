import { create } from "zustand";

export type Note = {
  id: string;
  title: string;
  content: string;
};

type VaultState = {
  notes: Note[];
  selectedNoteId: string | null;

  createNote: () => void;
  updateNote: (id: string, content: string) => void;
  selectNote: (id: string) => void;
};

export const useVault = create<VaultState>((set) => ({
  notes: [],
  selectedNoteId: null,

  createNote: () =>
    set((state) => {
      const id = crypto.randomUUID();

      const newNote = {
        id,
        title: "New Note",
        content: "# New Note\n\nStart typing...",
      };

      return {
        notes: [...state.notes, newNote],
        selectedNoteId: id,
      };
    }),

  updateNote: (id, content) =>
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, content } : n
      ),
    })),

  selectNote: (id) => set({ selectedNoteId: id }),
}));
