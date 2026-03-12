import StatusWidgetPage from "../../components/StatusWidgetPage/StatusWidgetPage";
import "./AccidentStatusPage.css";

export default function AccidentStatusPage() {
  return (
    <StatusWidgetPage
      page="ACCIDENT"
      title="Состояние аварийных флагов"
      containerClassName="accident-page-container"
      innerClassName="accident-page-inner"
      controlsClassName="accident-controls-header"
      contentClassName="accident-content-block"
      titleClassName="accident-blocks-title"
      gridClassName="accident-blocks-grid"
    />
  );
}
