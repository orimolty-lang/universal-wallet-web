"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { TrendingUp } from "lucide-react";

interface PerpsModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const PerpsModal = ({ isOpen, setIsOpen }: PerpsModalProps) => (
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
    <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          Perps
        </DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <p className="text-gray-400 mb-4">
          Trade perpetual futures with leverage. Long or short any asset.
        </p>
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <p className="text-sm text-gray-500">Perpetuals trading coming soon.</p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default PerpsModal;
