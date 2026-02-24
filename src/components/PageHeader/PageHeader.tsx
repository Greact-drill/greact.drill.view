import { Button } from "primereact/button";

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  className?: string;
  titleClassName?: string;
  showBackButton?: boolean;
}

export default function PageHeader({
  title,
  onBack,
  className,
  titleClassName,
  showBackButton = true,
}: PageHeaderProps) {
  return (
    <div className={className}>
      {showBackButton && onBack && (
        <Button
          icon="pi pi-arrow-left"
          label="Назад"
          severity="secondary"
          onClick={onBack}
          className="mb-4 back-button-custom"
        />
      )}
      <h1 className={titleClassName}>{title}</h1>
    </div>
  );
}
