import StatusWidgetPage from "../../components/StatusWidgetPage/StatusWidgetPage";
import "./KtuPage.css";

export default function KtuPage() {
  return (
    <StatusWidgetPage
      page="KTU"
      title="Параметры КТУ"
      emptyMessage="Нет настроенных виджетов для КТУ"
      containerClassName="ktu-page-container"
      innerClassName="ktu-page-inner"
      controlsClassName="bypass-controls-header"
      contentClassName="bypass-content-block"
      titleClassName="ktu-blocks-title"
      gridClassName="ktu-blocks-grid"
    />
  );
}