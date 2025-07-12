import { FC } from "react";

interface HudProps {
  villagersFound: number;
  totalVillagers: number;
}

export const Hud: FC<HudProps> = ({ villagersFound, totalVillagers }) => (
  <div className="fixed top-4 left-4 z-30 bg-black/70 text-white rounded-lg px-4 py-2 shadow-lg flex flex-row items-center gap-3">
    <span className="font-bold text-lg">👤 {villagersFound} / {totalVillagers} moradores</span>
  </div>
);
