import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OCRModel = 'gemini' | 'qwen';

interface SettingsState {
  ocrModel: OCRModel;
  
  // Actions
  setOCRModel: (model: OCRModel) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Default to Qwen model
      ocrModel: 'qwen',
      
      setOCRModel: (model) => set({ ocrModel: model }),
    }),
    {
      name: 'billpaint-settings',
    }
  )
);
