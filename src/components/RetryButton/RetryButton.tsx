import { Button } from "primereact/button";

interface RetryButtonProps {
  onClick: () => void;
  label?: string;
}

export default function RetryButton({ onClick, label = "Повторить" }: RetryButtonProps) {
  return <Button type="button" size="small" icon="pi pi-refresh" label={label} onClick={onClick} />;
}
