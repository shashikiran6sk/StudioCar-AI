"use client";

import { memo } from "react";
import { PhotoUploadItemRow } from "./photo-upload-item-row";
import { useVehicleCreateStore } from "./vehicle-create-store";

interface PhotoUploadStoreRowProps {
  clientId: string;
  index: number;
  count: number;
  choosing: boolean;
  onRemove: (clientId: string) => void;
  onReplace: (clientId: string) => void;
  onRetry: (clientId: string) => void;
}

/** Stable IDs keep progress updates scoped to the affected row. */
export const PhotoUploadStoreRow = memo(function PhotoUploadStoreRow({
  clientId, index, count, choosing, onRemove, onReplace, onRetry,
}: PhotoUploadStoreRowProps) {
  const photo = useVehicleCreateStore((state) => state.photos.find((item) => item.clientId === clientId));
  const movePhoto = useVehicleCreateStore((state) => state.movePhoto);
  const togglePhotoSelected = useVehicleCreateStore((state) => state.togglePhotoSelected);
  if (!photo) return null;
  return <PhotoUploadItemRow
    canMoveDown={index < count - 1} canMoveUp={index > 0} photo={photo}
    onMoveDown={() => movePhoto(clientId, 1)} onMoveUp={() => movePhoto(clientId, -1)}
    onRemove={() => onRemove(clientId)} onRetry={() => onRetry(clientId)}
    onReplace={choosing ? () => onReplace(clientId) : undefined}
    onToggleSelected={choosing ? () => togglePhotoSelected(clientId) : undefined}
    position={choosing ? index + 1 : undefined}
  />;
});
