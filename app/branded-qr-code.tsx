import QRCode from "qrcode";

type Props = { value: string; size?: number };

const QUIET_ZONE = 4;
const FINDER_SIZE = 7;
const inFinder = (row: number, column: number, modules: number) =>
  (row < FINDER_SIZE && column < FINDER_SIZE) ||
  (row < FINDER_SIZE && column >= modules - FINDER_SIZE) ||
  (row >= modules - FINDER_SIZE && column < FINDER_SIZE);

export function BrandedQrCode({ value, size = 220 }: Props) {
  const matrix = QRCode.create(value, { errorCorrectionLevel: "H" }).modules;
  const moduleCount = matrix.size;
  const viewSize = moduleCount + QUIET_ZONE * 2;
  const center = (moduleCount - 1) / 2;
  const color = "#69499B";
  const logoSize = 8.2;
  const logoPosition = QUIET_ZONE + center + 0.5 - logoSize / 2;
  const finder = (x: number, y: number, key: string) => (
    <g key={key}>
      <rect x={x} y={y} width="7" height="7" rx="1.65" fill={color} />
      <rect x={x + 1} y={y + 1} width="5" height="5" rx="1.1" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" rx=".75" fill={color} />
    </g>
  );

  return (
    <svg
      aria-label="Scan to download Tivorah"
      role="img"
      width={size}
      height={size}
      viewBox={`0 0 ${viewSize} ${viewSize}`}
    >
      <rect width={viewSize} height={viewSize} rx="2.6" fill="#fff" />
      {Array.from(matrix.data).map((active, index) => {
        if (!active) return null;
        const row = Math.floor(index / moduleCount);
        const column = index % moduleCount;
        const insideLogo =
          Math.abs(row - center) <= 4.6 && Math.abs(column - center) <= 4.6;
        if (inFinder(row, column, moduleCount) || insideLogo) return null;
        return (
          <circle
            key={`${row}-${column}`}
            cx={QUIET_ZONE + column + 0.5}
            cy={QUIET_ZONE + row + 0.5}
            r=".36"
            fill={color}
          />
        );
      })}
      {finder(QUIET_ZONE, QUIET_ZONE, "top-left")}
      {finder(QUIET_ZONE + moduleCount - 7, QUIET_ZONE, "top-right")}
      {finder(QUIET_ZONE, QUIET_ZONE + moduleCount - 7, "bottom-left")}
      <circle
        cx={QUIET_ZONE + center + 0.5}
        cy={QUIET_ZONE + center + 0.5}
        r={logoSize / 2}
        fill="#fff"
        stroke={color}
        strokeWidth=".48"
      />
      <image
        href="/tivorah-mark.png"
        x={logoPosition + 1.05}
        y={logoPosition + 1.05}
        width={logoSize - 2.1}
        height={logoSize - 2.1}
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
}
