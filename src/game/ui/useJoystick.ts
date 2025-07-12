import { create } from "zustand";

interface JoystickState {
  x: number;
  y: number;
  set: (xy: { x: number; y: number }) => void;
}

export const useJoystick = create<JoystickState>((set) => ({
  x: 0,
  y: 0,
  set: ({ x, y }) => set({ x, y }),
}));
