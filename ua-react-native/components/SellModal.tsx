import React from "react";
import SwapModal from "./SwapModal";

interface SellModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SellModal({ visible, onClose, onSuccess }: SellModalProps) {
  return (
    <SwapModal
      visible={visible}
      onClose={onClose}
      targetToken={null}
      isSellMode={true}
    />
  );
}
