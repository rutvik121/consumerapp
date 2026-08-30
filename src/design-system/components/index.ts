/**
 * DESIGN SYSTEM — the app's reusable visual vocabulary.
 *
 * RULE: before building anything new, check this list. If a pattern exists,
 * use it. Two different solutions to the same problem is the single fastest
 * way to make a product feel unfinished.
 *
 * This set is deliberately small. It will grow as product screens are built,
 * but only when a genuine second use case appears — not in anticipation of one.
 */

export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './Button';
export { IconButton, type IconButtonProps } from './IconButton';
export { Surface, type SurfaceProps, type SurfaceVariant } from './Surface';
export { ListRow, ListGroup, type ListRowProps } from './ListRow';
export { StatusBadge, type StatusBadgeProps } from './StatusBadge';
export { MetricTile, type MetricTileProps, type MetricTone } from './MetricTile';
export { SectionHeader, type SectionHeaderProps } from './SectionHeader';
export { Divider } from './Divider';
export { Input, type InputProps } from './Input';
export { SearchInput, type SearchInputProps } from './SearchInput';
export { Select, type SelectProps, type SelectOption } from './Select';
export { QuantityInput, type QuantityInputProps } from './QuantityInput';
export { AppBar, type AppBarProps } from './AppBar';
export { ContextBar, type ContextBarProps } from './ContextBar';
export { BottomSheet, type BottomSheetProps } from './BottomSheet';
export { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';
export { EmptyState, type EmptyStateProps } from './EmptyState';
export { LoadingState, type LoadingStateProps } from './LoadingState';
export { ErrorState, type ErrorStateProps } from './ErrorState';
export { OVERLAY_ROOT_ID, getOverlayRoot } from './overlayRoot';
