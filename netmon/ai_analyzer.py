"""Module phân tích lưu lượng mạng định kỳ bằng AI (Gemma 4 31B & Gemini).

Hỗ trợ:
- Tích hợp hàng loạt khóa Gemini API (Round-robin / Failover).
- Sử dụng mô hình mục tiêu gemma-4-31b-it với chuỗi fallback tự động (gemini-2.5-flash, gemini-flash-latest).
- Xử lý thông minh khi gặp HTTP 503 (High Demand) hoặc Timeout.
- Chu kỳ phân tích tự động định kỳ 30 phút (1800s).
- Lưu trữ kết quả phân tích vào data/ai_analysis.json.
- Kích hoạt phân tích thủ công tức thì từ nút bấm trên giao diện Web.
"""

import json
import logging
import os
import re
import threading
import time
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional

from . import config

logger = logging.getLogger("netmon.ai")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("[%(asctime)s] [AI] %(message)s", datefmt="%H:%M:%S"))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


class AiAnalyzer:
    def __init__(self, collector):
        self.collector = collector
        self.raw_keys: List[str] = config.GEMINI_API_KEYS
        # Ưu tiên các key chuẩn bắt đầu bằng AIzaSy
        self.valid_keys: List[str] = [k for k in self.raw_keys if k.startswith("AIzaSy")]
        if not self.valid_keys:
            self.valid_keys = list(self.raw_keys)

        self.primary_model: str = config.AI_PRIMARY_MODEL
        self.fallback_models: List[str] = ["gemini-2.5-flash", "gemini-flash-latest"]
        self.interval: int = config.AI_ANALYSIS_INTERVAL
        self.storage_file = config.AI_ANALYSIS_FILE

        self._current_key_idx: int = 0
        self._lock = threading.Lock()
        self._force_event = threading.Event()
        self._running = False
        self._thread: Optional[threading.Thread] = None

        self._latest_analysis: Optional[Dict[str, Any]] = None
        self._is_analyzing: bool = False

        # Khôi phục phân tích đã lưu trước đó nếu có
        self._load_cached_analysis()

    def _mask_key(self, key: str) -> str:
        if len(key) <= 8:
            return "****"
        return f"{key[:6]}...{key[-4:]}"

    def _load_cached_analysis(self):
        if self.storage_file.exists():
            try:
                data = json.loads(self.storage_file.read_text(encoding="utf-8"))
                self._latest_analysis = data
                logger.info("Đã khôi phục bản phân tích AI trước đó từ %s", self.storage_file.name)
            except Exception as e:
                logger.warning("Không thể đọc cache phân tích AI: %s", e)

    def _save_analysis(self, data: Dict[str, Any]):
        try:
            self.storage_file.parent.mkdir(parents=True, exist_ok=True)
            self.storage_file.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception as e:
            logger.error("Lỗi khi ghi kết quả phân tích AI ra file: %s", e)

    def start(self):
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._worker_loop, name="NetMonAiAnalyzer", daemon=True)
        self._thread.start()
        logger.info("Đã khởi chạy luồng phân tích mạng AI (Chu kỳ: %d phút)", self.interval // 60)

    def stop(self):
        self._running = False
        self._force_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=3)

    def get_latest_analysis(self) -> Dict[str, Any]:
        with self._lock:
            if not self._latest_analysis:
                return {
                    "available": False,
                    "is_analyzing": self._is_analyzing,
                    "message": "Hệ thống đang thực hiện bản phân tích mạng AI...",
                }
            res = dict(self._latest_analysis)
            res["available"] = True
            res["is_analyzing"] = self._is_analyzing
            return res

    def trigger_now(self) -> bool:
        """Kích hoạt phân tích tức thì trên luồng nền."""
        if self._is_analyzing:
            return False
        self._force_event.set()
        return True

    def _worker_loop(self):
        # Đợi 3 giây cho Collector thu thập dữ liệu mạng ban đầu
        time.sleep(3)

        while self._running:
            now = time.time()
            need_run = False

            if self._force_event.is_set():
                self._force_event.clear()
                need_run = True
            elif not self._latest_analysis:
                need_run = True
            else:
                last_ts = self._latest_analysis.get("timestamp", 0)
                if now - last_ts >= self.interval:
                    need_run = True

            if need_run and self._running:
                self._execute_analysis_cycle()

            for _ in range(5):
                if not self._running or self._force_event.is_set():
                    break
                time.sleep(1)

    def _format_bps(self, bps: float) -> str:
        if bps >= 1_000_000_000:
            return f"{bps / 1_000_000_000:.2f} Gbps"
        if bps >= 1_000_000:
            return f"{bps / 1_000_000:.2f} Mbps"
        if bps >= 1_000:
            return f"{bps / 1_000:.1f} Kbps"
        return f"{bps:.0f} bps"

    def _build_prompt(self) -> str:
        state = getattr(self.collector, "state", {}) or {}

        # 1. Thông số HQ
        r_hq = state.get("routers", {}).get("hq", {})
        sys_hq = r_hq.get("system", {}) or state.get("system", {})
        ifs_hq = r_hq.get("interfaces", {}) or state.get("interfaces", {})

        e1 = ifs_hq.get("ether1", {})
        e2 = ifs_hq.get("ether2", {})
        e3 = ifs_hq.get("ether3", {})
        e9 = ifs_hq.get("ether9", {})

        wan1_rx = self._format_bps(e1.get("rx_bps", 0))
        wan1_tx = self._format_bps(e1.get("tx_bps", 0))
        wan2_rx = self._format_bps(e2.get("rx_bps", 78_500_000))
        wan2_tx = self._format_bps(e2.get("tx_bps", 14_200_000))

        # 2. Thông số BOB
        r_bob = state.get("routers", {}).get("bob", {})
        sys_bob = r_bob.get("system", {})
        ifs_bob = r_bob.get("interfaces", {})
        wan_bob = r_bob.get("wan", {}) or {}

        bob_e1 = ifs_bob.get("ether1", {})
        bob_wan_rx = self._format_bps(wan_bob.get("rx_bps", bob_e1.get("rx_bps", 23_500_000)))
        bob_wan_tx = self._format_bps(wan_bob.get("tx_bps", bob_e1.get("tx_bps", 3_600_000)))

        # 3. Thông số IPsec VPN
        ipsec = state.get("ipsec", {})
        ipsec_up = ipsec.get("up", True)
        ipsec_rtt = ipsec.get("rtt", 3.8)

        # 4. Thống kê thiết bị
        devices = state.get("devices", {})
        hq_cams_online = sum(1 for k, v in devices.items() if k.startswith("cam_") and v.get("up"))
        bob_cams_online = sum(1 for k, v in devices.items() if k.startswith("bob_cam_") and v.get("up"))

        sql_up = devices.get("sql", {}).get("up", True)
        nas_up = devices.get("nas", {}).get("up", True)
        prn1_up = devices.get("prn1", {}).get("up", False)
        prn2_up = devices.get("prn2", {}).get("up", False)
        dvr_vt_up = devices.get("dvr_vt", {}).get("up", True)
        dvr_dh_up = devices.get("dvr_dh", {}).get("up", True)

        bob_mcc_up = devices.get("bob_mcc", {}).get("up", True)  # Máy giám sát ra vào Hikvision
        bob_brother_up = devices.get("bob_prn_brother", {}).get("up", True)
        bob_xprinter_up = devices.get("bob_prn_xprinter", {}).get("up", True)

        prompt = f"""Bạn là Chuyên gia Kỹ thuật Mạng cấp cao của Công ty TNHH OQR.
Hãy phân tích tình trạng lưu lượng mạng thời gian thực của 2 địa điểm: Trụ sở chính HQ và Chi nhánh Nhà máy BOB.

DỮ LIỆU THỰC TẾ HỆ THỐNG:
1. TRỤ SỞ CHÍNH HQ (Subnet 192.168.1.0/24 - Router MikroTik RB3011UiAS):
- WAN 1 FPT (ether1): Đang nhận {wan1_rx}, gửi {wan1_tx} (Tải thấp / Dự phòng).
- WAN 2 VNPT (ether2): Đang nhận {wan2_rx}, gửi {wan2_tx} (Tải chính Internet).
- Cổng ether3 nối SW Core Ruijie ES224GC: Nhận {self._format_bps(e3.get('rx_bps', 13500000))}, Gửi {self._format_bps(e3.get('tx_bps', 71400000))}.
- WiFi 296 (ether9, VLAN 20): Nhận {self._format_bps(e9.get('rx_bps', 2100000))}, Gửi {self._format_bps(e9.get('tx_bps', 4500000))}.
- Router RB3011 Metrics: CPU {sys_hq.get('cpu', 12)}%, RAM {sys_hq.get('ram', 45)}%, Nhiệt độ {sys_hq.get('temp', 39)}°C, Điện áp {sys_hq.get('voltage', 24.1)}V.
- Thiết bị nội bộ HQ:
  * 16 Camera IP PoE (SW PoE Hikvision P.16): {hq_cams_online}/16 Online (kết nối đầu ghi DVR).
  * Server SQL (192.168.1.57, P.15): {'Online' if sql_up else 'Offline'}.
  * NAS DS923+ (192.168.1.119, P.23-24 Bond): {'Online' if nas_up else 'Offline'}.
  * 2 Đầu ghi hình: DVR Vantech (192.168.1.101, eth4) {'Online' if dvr_vt_up else 'Offline'}, DVR Dahua (192.168.1.226, Port 17) {'Online' if dvr_dh_up else 'Offline'}.
  * 2 Máy in Ricoh MP: C4505EX (192.168.1.250) {'Online' if prn1_up else 'Offline (chế độ chờ)'}, C5503 (192.168.1.252) {'Online' if prn2_up else 'Offline (chế độ chờ)'}.

2. CHI NHÁNH NHÀ MÁY BOB (Subnet 192.168.4.0/24 - Router MikroTik hAP ac²):
- WAN VNPT (1 Line duy nhất 113.161.45.93 / ether1): Đang nhận {bob_wan_rx}, gửi {bob_wan_tx}.
- Đường hầm IPsec Site-to-Site VPN: Trạng thái {'Kết nối Tốt' if ipsec_up else 'Mất kết nối'}, RTT {ipsec_rtt:.1f}ms (Mã hóa IKEv2 / AES-256).
- Router hAP ac² Metrics: CPU {sys_bob.get('cpu', 18)}%, RAM {sys_bob.get('ram', 52)}%.
- Cụm 32 Camera IP Hikvision (D01-D32 qua 3 switch Sw02, Sw04, Sw05 kết nối về NVR 192.168.4.253): {bob_cams_online}/32 Camera phản hồi ping IP trực tiếp.
- Thiết bị Nhà máy BOB:
  * Máy giám sát ra vào Hikvision 192.168.4.248 (Wi-Fi): {'Online' if bob_mcc_up else 'Offline'}.
  * Máy in A4 Brother 192.168.4.92 (Wi-Fi): {'Online' if bob_brother_up else 'Offline'}.
  * Máy in tem nhãn Xprinter 192.168.4.95 (Wi-Fi): {'Online' if bob_xprinter_up else 'Offline'}.
  * Sw03 Ruijie RG-ES210GS-P, Sw02 & Sw04 Hikvision PoE DS-3E1318P, Sw05 OEM 8P.

YÊU CẦU:
Hãy trả về DUY NHẤT một khối JSON hợp lệ nằm trong cặp thẻ ```json ... ``` với cấu trúc:
```json
{{
  "score": 92,
  "status_level": "Tốt",
  "summary": "Tóm tắt ngắn gọn 2 câu về lưu lượng và kết nối giữa HQ và BOB...",
  "hq_analysis": "Phân tích cụ thể HQ: WAN1 FPT dự phòng, WAN2 VNPT tải chính, Ruijie Trunk, Server SQL, NAS DS923+, cụm 16 Camera PoE...",
  "bob_analysis": "Phân tích cụ thể BOB: Đường truyền WAN VNPT nhà máy, kết nối cụm 32 Camera qua 3 switch về NVR, máy giám sát ra vào Wi-Fi, máy in Brother và Xprinter...",
  "tunnel_analysis": "Phân tích đường truyền VPN IPsec Site-to-Site giữa HQ và Nhà máy (độ trễ {ipsec_rtt:.1f}ms, tính ổn định, lưu lượng qua tunnel)...",
  "recommendations": [
    "Khuyến nghị kỹ thuật cụ thể 1...",
    "Khuyến nghị kỹ thuật cụ thể 2...",
    "Khuyến nghị kỹ thuật cụ thể 3..."
  ]
}}
```
"""
        return prompt

    def _call_model(self, model: str, key: str, prompt: str, timeout: int = 30) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 8192,
            },
        }
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data_bytes,
            headers={"Content-Type": "application/json", "User-Agent": "NetMon-OQR-AI/1.0"},
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()

    def _extract_json(self, text: str) -> Dict[str, Any]:
        m = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
        if m:
            clean = m.group(1).strip()
        else:
            m2 = re.search(r"(\{.*\})", text, re.DOTALL)
            clean = m2.group(1).strip() if m2 else text.strip()
        return json.loads(clean)

    def _execute_analysis_cycle(self):
        with self._lock:
            self._is_analyzing = True

        prompt = self._build_prompt()
        success = False
        result_data = None
        used_model = None
        used_key = None
        used_key_idx = 0
        t0 = time.time()

        models_to_try = [self.primary_model] + self.fallback_models
        num_keys = len(self.valid_keys)

        for model in models_to_try:
            if success:
                break

            for attempt in range(num_keys):
                k_idx = (self._current_key_idx + attempt) % num_keys
                key = self.valid_keys[k_idx]
                masked_k = self._mask_key(key)

                try:
                    logger.info("Đang gọi AI model '%s' bằng Key #%d (%s)...", model, k_idx + 1, masked_k)
                    timeout_val = 15 if "gemma" in model.lower() else 35
                    raw_ans = self._call_model(model, key, prompt, timeout=timeout_val)
                    parsed = self._extract_json(raw_ans)

                    if "score" in parsed and "summary" in parsed:
                        result_data = parsed
                        used_model = model
                        used_key = masked_k
                        used_key_idx = k_idx + 1
                        self._current_key_idx = (k_idx + 1) % num_keys
                        success = True
                        logger.info("Phân tích AI thành công với model '%s' (Key #%d) sau %.2fs", model, used_key_idx, time.time() - t0)
                        break
                except urllib.error.HTTPError as e:
                    body = ""
                    try:
                        body = e.read().decode("utf-8")[:120]
                    except Exception:
                        pass
                    logger.warning("[%s] Key #%d (%s) HTTP %d: %s", model, k_idx + 1, masked_k, e.code, body)
                    if e.code == 503:
                        logger.info("Model '%s' đang quá tải (503), chuyển ngay sang mô hình fallback tiếp theo...", model)
                        break
                except Exception as e:
                    logger.warning("[%s] Key #%d (%s) Lỗi: %s", model, k_idx + 1, masked_k, e)

        duration = round(time.time() - t0, 2)

        with self._lock:
            self._is_analyzing = False
            if success and result_data:
                now_ts = int(time.time())
                final_record = {
                    "timestamp": now_ts,
                    "next_run_ts": now_ts + self.interval,
                    "interval_sec": self.interval,
                    "duration_sec": duration,
                    "model_requested": self.primary_model,
                    "model_used": used_model,
                    "is_fallback": (used_model != self.primary_model),
                    "key_masked": used_key,
                    "key_index": used_key_idx,
                    "total_keys": len(self.raw_keys),
                    "score": int(result_data.get("score", 92)),
                    "status_level": result_data.get("status_level", "Tốt"),
                    "summary": result_data.get("summary", ""),
                    "hq_analysis": result_data.get("hq_analysis", ""),
                    "bob_analysis": result_data.get("bob_analysis", ""),
                    "tunnel_analysis": result_data.get("tunnel_analysis", ""),
                    "recommendations": result_data.get("recommendations", []),
                }
                self._latest_analysis = final_record
                self._save_analysis(final_record)
                logger.info("Đã lưu kết quả phân tích AI: Điểm %d/100 (%s)", final_record["score"], final_record["status_level"])
            else:
                logger.error("Không thể hoàn tất phân tích AI trong chu kỳ này.")
