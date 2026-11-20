/**
 * Thành phần Hàng / Khối: "Phân tích lưu lượng mạng định kỳ bằng AI" (ai_analysis_row.js).
 * Sử dụng mô hình Google Gemma 4 31B (kết hợp xoay vòng khóa API và fallback thông minh),
 * định kỳ cập nhật 30 phút một lần và hỗ trợ kích hoạt thủ công tức thì.
 */

import { fetchAiAnalysis, triggerAiAnalyzeNow } from "../api.js";
import { escapeHtml } from "../format.js";

let countdownTimer = null;
let lastNextRunTs = 0;
let isAnalyzingNow = false;

export const AiAnalysisRow = {
  countdownInterval: null,

  init() {
    this.startCountdownTicker();
  },

  startCountdownTicker() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      this.updateCountdownDisplay();
    }, 1000);
  },

  updateCountdownDisplay() {
    const el = document.getElementById("ai-next-run-badge");
    if (!el) return;

    if (isAnalyzingNow) {
      el.className = "ai-meta-tag ai-tag-analyzing";
      el.innerHTML = `<span class="ai-spin-icon">↻</span> Đang phân tích...`;
      return;
    }

    if (!lastNextRunTs) {
      el.textContent = "30:00";
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const diff = Math.max(0, lastNextRunTs - now);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    const timeStr = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

    el.className = "ai-meta-tag ai-tag-timer";
    el.innerHTML = `⏱ Phân tích tiếp theo sau: <strong>${timeStr}</strong>`;
  },

  formatMarkdown(text) {
    if (!text) return "";
    let html = escapeHtml(text);

    // Bold text **bold**
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Code `code`
    html = html.replace(/`(.*?)`/g, "<code>$1</code>");
    // Bullet lists
    html = html.replace(/^\s*[\-\*]\s+(.*)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");
    // Headers ###
    html = html.replace(/^###\s+(.*)$/gm, "<h4 class='ai-subheading'>$1</h4>");
    html = html.replace(/^##\s+(.*)$/gm, "<h3 class='ai-heading'>$1</h3>");
    // Line breaks
    html = html.replace(/\n\n/g, "<p></p>").replace(/\n/g, "<br>");

    return html;
  },

  getScoreBadge(score, level) {
    let colorClass = "ai-score-green";
    let icon = "✓";
    if (score < 60) {
      colorClass = "ai-score-red";
      icon = "⚠";
    } else if (score < 80) {
      colorClass = "ai-score-yellow";
      icon = "⚡";
    }

    return `
      <div class="ai-score-badge ${colorClass}">
        <span class="ai-score-num">${score}</span>
        <span class="ai-score-denom">/100</span>
        <span class="ai-score-level">${icon} ${escapeHtml(level || "Tốt")}</span>
      </div>
    `;
  },

  async handleManualAnalyze() {
    const btn = document.getElementById("ai-manual-trigger-btn");
    if (!btn) return;

    btn.disabled = true;
    btn.innerHTML = `<span class="ai-spin-icon">↻</span> Đang gửi lệnh...`;

    try {
      isAnalyzingNow = true;
      this.updateCountdownDisplay();
      const res = await triggerAiAnalyzeNow();
      btn.innerHTML = `<span class="ai-spin-icon">↻</span> Đang phân tích bằng AI...`;

      // Thăm dò kiểm tra kết quả sau mỗi 3 giây trong tối đa 45 giây
      let checks = 0;
      const poll = setInterval(async () => {
        checks++;
        try {
          const latest = await fetchAiAnalysis();
          if (!latest.is_analyzing || checks >= 15) {
            clearInterval(poll);
            isAnalyzingNow = false;
            this.render(latest);
            btn.disabled = false;
            btn.innerHTML = `⚡ Phân tích lại ngay`;
          }
        } catch (e) {
          if (checks >= 15) {
            clearInterval(poll);
            isAnalyzingNow = false;
            btn.disabled = false;
            btn.innerHTML = `⚡ Phân tích lại ngay`;
          }
        }
      }, 3000);
    } catch (e) {
      alert("Lỗi kích hoạt phân tích AI: " + e.message);
      isAnalyzingNow = false;
      btn.disabled = false;
      btn.innerHTML = `⚡ Phân tích lại ngay`;
    }
  },

  render(analysis) {
    const container = document.getElementById("ai-analysis-container");
    if (!container) return;

    if (!analysis || !analysis.available) {
      container.innerHTML = `
        <div class="card ai-card ai-loading-box">
          <div class="ai-empty-state">
            <span class="ai-spin-icon" style="font-size:32px;">↻</span>
            <div style="margin-top:12px; font-weight:600;">Hệ thống AI đang tổng hợp số liệu lưu lượng mạng HQ và BOB...</div>
            <div class="muted" style="margin-top:4px; font-size:13px;">Mô hình: Gemma 4 31B · Định kỳ 30 phút/lần</div>
          </div>
        </div>
      `;
      return;
    }

    lastNextRunTs = analysis.next_run_ts || 0;
    isAnalyzingNow = !!analysis.is_analyzing;

    const timeStr = analysis.timestamp
      ? new Date(analysis.timestamp * 1000).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          day: "2-digit",
          month: "2-digit",
        })
      : "Vừa xong";

    const modelName = analysis.model_used || analysis.model_requested || "gemma-4-31b-it";
    const isFallback = analysis.is_fallback;
    const keyInfo = analysis.key_masked
      ? `Key #${analysis.key_index}/${analysis.total_keys} (${escapeHtml(analysis.key_masked)})`
      : "Multi-Key Pool";

    const recs = analysis.recommendations || [];
    let recsHtml = "";
    if (recs.length > 0) {
      recsHtml = `
        <div class="ai-recs-section">
          <div class="ai-section-title">
            <span class="ai-icon">💡</span> Khuyến nghị &amp; Kiến nghị Kỹ thuật Tối ưu
          </div>
          <div class="ai-recs-grid">
            ${recs
              .map(
                (r, idx) => `
              <div class="ai-rec-item">
                <span class="ai-rec-num">${idx + 1}</span>
                <div class="ai-rec-content">${this.formatMarkdown(r)}</div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="card ai-card">
        <!-- AI Card Top Header -->
        <div class="ai-header-bar">
          <div class="ai-header-left">
            <div class="ai-title-wrap">
              <span class="ai-glow-sparkle">✨</span>
              <span class="ai-main-title">Trợ lý AI Giám sát Mạng Doanh nghiệp OQR</span>
              <span class="ai-model-tag" title="Mô hình AI phân tích">
                ${escapeHtml(modelName)}
                ${isFallback ? '<span class="ai-fallback-badge">Smart Fallback</span>' : ""}
              </span>
            </div>
            <div class="ai-meta-row">
              <span class="ai-meta-tag">🕒 Cập nhật: <strong>${timeStr}</strong></span>
              <span class="ai-meta-tag">🔑 Khóa API: <strong>${keyInfo}</strong></span>
              <span class="ai-meta-tag">⏱ Thời gian xử lý: <strong>${analysis.duration_sec || 0}s</strong></span>
              <span id="ai-next-run-badge" class="ai-meta-tag ai-tag-timer"></span>
            </div>
          </div>

          <div class="ai-header-right">
            ${this.getScoreBadge(analysis.score, analysis.status_level)}
            <button id="ai-manual-trigger-btn" class="ai-action-btn" title="Chạy phân tích tức thì trên dữ liệu mạng thời gian thực">
              ⚡ Phân tích lại ngay
            </button>
          </div>
        </div>

        <!-- Tóm tắt chung Executive Summary -->
        <div class="ai-summary-box">
          <div class="ai-summary-icon">📢</div>
          <div class="ai-summary-text">
            <strong>Tóm tắt Tổng quan:</strong> ${escapeHtml(analysis.summary || "Đang tổng hợp...")}
          </div>
        </div>

        <!-- 3 Cột đánh giá chi tiết: HQ, BOB, Tunnel IPsec -->
        <div class="ai-analysis-grid">
          <!-- Cột 1: HQ -->
          <div class="ai-col-card">
            <div class="ai-col-header ai-header-hq">
              <span>🏢 Trụ sở chính HQ (192.168.1.0/24)</span>
            </div>
            <div class="ai-col-body">
              ${this.formatMarkdown(analysis.hq_analysis)}
            </div>
          </div>

          <!-- Cột 2: BOB -->
          <div class="ai-col-card">
            <div class="ai-col-header ai-header-bob">
              <span>🏭 Chi nhánh Nhà máy BOB (192.168.4.0/24)</span>
            </div>
            <div class="ai-col-body">
              ${this.formatMarkdown(analysis.bob_analysis)}
            </div>
          </div>

          <!-- Cột 3: IPsec Tunnel -->
          <div class="ai-col-card">
            <div class="ai-col-header ai-header-tunnel">
              <span>🔗 Kết nối IPsec Site-to-Site VPN</span>
            </div>
            <div class="ai-col-body">
              ${this.formatMarkdown(analysis.tunnel_analysis)}
            </div>
          </div>
        </div>

        <!-- Khuyến nghị kỹ thuật -->
        ${recsHtml}
      </div>
    `;

    // Gắn sự kiện nút phân tích lại
    const triggerBtn = document.getElementById("ai-manual-trigger-btn");
    if (triggerBtn) {
      triggerBtn.onclick = () => this.handleManualAnalyze();
    }

    this.updateCountdownDisplay();
  },
};
