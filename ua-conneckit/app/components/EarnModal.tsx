"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Percent } from "lucide-react";

interface EarnModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const EarnModal = ({ isOpen, setIsOpen }: EarnModalProps) => (
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
    <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-white">
          <Percent className="w-5 h-5 text-purple-400" />
          Earn
        </DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <p className="text-gray-400 mb-4">
          Stake your assets and earn yield through staking, lending, and more.
        </p>
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <p className="text-sm text-gray-500">Earn products coming soon.</p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default EarnModal;
