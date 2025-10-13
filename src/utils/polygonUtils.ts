/**
 * Преобразует строку координат полигона в процентах ("X% Y%, ...")
 * в строку абсолютных координат SVG ("X Y, ...") относительно заданного viewBox.
 * * @param polygonString Строка координат в процентах, например: "3.4% 84.5%, ..."
 * @param viewBoxWidth Ширина viewBox SVG (например, 1010)
 * @param viewBoxHeight Высота viewBox SVG (например, 1024)
 * @returns Строка абсолютных координат, например: "34.34 865.66, ..."
 */
export function polygonPercentToSvgPoints(
    polygonString: string, 
    viewBoxWidth: number = 1010, 
    viewBoxHeight: number = 1024
): string {
    if (!polygonString) return "";

    const pointsArray = polygonString.split(',').map(point => point.trim());

    const svgPoints = pointsArray.map(point => {
        const [xStr, yStr] = point.split(/\s+/);
        
        // Удаляем '%' и конвертируем в число
        const xPercent = parseFloat(xStr.replace('%', ''));
        const yPercent = parseFloat(yStr.replace('%', ''));

        // Пересчитываем в абсолютные координаты
        const xAbs = (xPercent / 100) * viewBoxWidth;
        const yAbs = (yPercent / 100) * viewBoxHeight;

        // Округляем до двух знаков после запятой для чистоты
        return `${xAbs.toFixed(2)} ${yAbs.toFixed(2)}`;
    });

    return svgPoints.join(' ');
}