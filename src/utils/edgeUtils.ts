import type { EdgeAttribute, RawEdgeAttributes } from "../types/edge";

/**
 * Преобразует плоский объект тегов (RawEdgeAttributes) в структурированный 
 * объект EdgeAttribute, необходимый для логики проверки ошибок и компонента EdgeStatusPanel.
 * * @param rawAttributes - Плоский объект { tag: value } из API.
 * @param edgeId - ID текущего Edge (для поля edge_key).
 */
export const transformRawAttributes = (rawAttributes: RawEdgeAttributes, edgeId: string): EdgeAttribute => {

    const isBypassOk = rawAttributes['P2_feed'] === 0 && rawAttributes['PC_IO_2.30'] === 0;
    const isDriveOk = rawAttributes['PC_IO_2.25'] === 1 && rawAttributes['PC_IO_2.26'] === 1;
    const isMaintenanceOk = rawAttributes['PC_IO_2.31'] === 0;

    return {
        id: 0,
        edge_key: edgeId, 
        
        // Маппинг состояния оборудования
        bypass_state: isBypassOk ? 'closed' : 'open',
        drive_state: isDriveOk ? 'normal' : 'error',
        
        // Маппинг ТО
        daily_maintenance: isMaintenanceOk,
        weekly_maintenance: isMaintenanceOk,
        monthly_maintenance: isMaintenanceOk,
        semiannual_maintenance: isMaintenanceOk,
        annual_maintenance: isMaintenanceOk,
    } as EdgeAttribute;
};