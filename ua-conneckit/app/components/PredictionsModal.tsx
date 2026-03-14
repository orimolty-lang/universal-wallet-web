"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Target } from "lucide-react";

interface PredictionsModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const PredictionsModal = ({ isOpen, setIsOpen }: PredictionsModalProps) => (
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
    <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-white">
          <Target className="w-5 h-5 text-purple-400" />
          Predictions
        </DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <p className="text-gray-400 mb-4">
          Predict market outcomes and earn rewards for correct predictions.
        </p>
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <p className="text-sm text-gray-500">Predictions market coming soon.</p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default PredictionsModal;
