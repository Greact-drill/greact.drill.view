import BackButton from "../BackButton/BackButton";

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
        <BackButton onClick={onBack} className="mb-4" />
      )}
      <h1 className={titleClassName}>{title}</h1>
    </div>
  );
}
