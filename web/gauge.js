/**
 * Vẽ đồng hồ đo bán nguyệt (Gauge) phong cách Grafana (gauge.js).
 */

const CX = 110, CY = 95, R = 72;
// Cung bán nguyệt từ 180° đến 0° (nửa trên) hoặc từ 150° đến 30°
const START_DEG = 150;
const SWEEP_DEG = 240;

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function point(deg) {
  const rad = degToRad(deg);
  return [CX + R * Math.cos(rad), CY + R * Math.sin(rad)];
}

function arcPath(startDeg, sweepDeg) {
  const [x1, y1] = point(startDeg);
  const [x2, y2] = point(startDeg + sweepDeg);
  const largeArc = sweepDeg > 180 ? 1 : 0;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${R} ${R} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

export const GAUGE_COLORS = {
  green: "#4cc38a",
  yellow: "#e0a321",
  orange: "#f58231",
  red: "#e04f43",
  track: "#22252b",
};

/**
 * Trả về mã màu theo giá trị và ngưỡng.
 */
function pickColor(val, steps) {
  for (const [limit, col] of steps) {
    if (val <= limit) return col;
  }
  return steps[steps.length - 1][1];
}

/**
 * Tạo HTML SVG cho một Gauge.
 * title: Tên tiêu đề (e.g. "CPU Load")
 * value: Giá trị số
 * text: Chuỗi hiển thị bên trong (e.g. "24%", "34 °C")
 * max: Giá trị tối đa (thường là 100)
 * steps: [[ngưỡng, mã_màu], ...]
 */
export function gauge({
  title,
  value,
  text,
  max = 100,
  steps = [
    [60, GAUGE_COLORS.green],
    [80, GAUGE_COLORS.yellow],
    [90, GAUGE_COLORS.orange],
    [Infinity, GAUGE_COLORS.red],
  ],
}) {
  const hasVal = value != null && !isNaN(value);
  const num = hasVal ? Math.min(max, Math.max(0, value)) : 0;
  const pct = max > 0 ? num / max : 0;
  const color = hasVal ? pickColor(num, steps) : GAUGE_COLORS.green;

  const trackPath = arcPath(START_DEG, SWEEP_DEG);
  const fillSweep = Math.max(0.1, SWEEP_DEG * pct);
  const fillPath = arcPath(START_DEG, fillSweep);

  return `
    <div class="card gauge-card">
      <div class="gauge-title">${title}</div>
      <div class="gauge-svg-wrap">
        <svg viewBox="0 0 220 135" class="gauge-svg">
          <!-- Track nền -->
          <path d="${trackPath}" fill="none" style="stroke:var(--gauge-track)" stroke-width="16" stroke-linecap="round"/>
          
          <!-- Vạch các đoạn màu mờ ở viền ngoài -->
          <path d="${arcPath(START_DEG, SWEEP_DEG * 0.6)}" fill="none" stroke="${GAUGE_COLORS.green}" stroke-width="2" opacity="0.35"/>
          <path d="${arcPath(START_DEG + SWEEP_DEG * 0.6, SWEEP_DEG * 0.2)}" fill="none" stroke="${GAUGE_COLORS.yellow}" stroke-width="2" opacity="0.4"/>
          <path d="${arcPath(START_DEG + SWEEP_DEG * 0.8, SWEEP_DEG * 0.2)}" fill="none" stroke="${GAUGE_COLORS.red}" stroke-width="2" opacity="0.4"/>
          
          <!-- Thanh giá trị hiện tại -->
          ${hasVal && pct > 0 ? `<path d="${fillPath}" fill="none" stroke="${color}" stroke-width="16" stroke-linecap="round"/>` : ""}
          
          <!-- Giá trị số chính giữa -->
          <text x="110" y="102" text-anchor="middle" font-size="34" font-weight="700" fill="${color}" class="gauge-value">
            ${hasVal ? text : "–"}
          </text>
        </svg>
      </div>
    </div>
  `;
}
