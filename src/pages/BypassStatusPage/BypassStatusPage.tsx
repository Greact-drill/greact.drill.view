import StatusWidgetPage from '../../components/StatusWidgetPage/StatusWidgetPage';
import './BypassStatusPage.css';
export default function BypassStatusPage() {
    return (
        <StatusWidgetPage
            page="BYPASS"
            title="Состояние оборудования"
            containerClassName="bypass-page-container"
            innerClassName="bypass-page-inner"
            controlsClassName="bypass-controls-header"
            contentClassName="bypass-content-block"
            titleClassName="bypass-blocks-title"
            gridClassName="bypass-blocks-grid"
        />
    );
}