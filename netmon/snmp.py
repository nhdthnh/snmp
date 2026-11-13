"""SNMP v2c client tối giản bằng thư viện chuẩn (không cần cài net-snmp hay pysnmp)."""
import random
import socket

GET, GETNEXT = 0xA0, 0xA1
_UNSIGNED = {0x41, 0x42, 0x43, 0x46}   # Counter32, Gauge32, TimeTicks, Counter64
_END_MARKERS = {0x80, 0x81, 0x82}      # noSuchObject, noSuchInstance, endOfMibView


class SnmpError(Exception):
    pass


# ---- BER encode ------------------------------------------------------------
def _length(n):
    if n < 128:
        return bytes([n])
    raw = n.to_bytes((n.bit_length() + 7) // 8, "big")
    return bytes([0x80 | len(raw)]) + raw


def _tlv(tag, body):
    return bytes([tag]) + _length(len(body)) + body


def _int(n):
    return _tlv(0x02, n.to_bytes((n.bit_length() + 8) // 8, "big", signed=True))


def _oid(text):
    parts = [int(p) for p in text.strip(".").split(".")]
    body = bytearray([parts[0] * 40 + parts[1]])
    for p in parts[2:]:
        chunk = [p & 0x7F]
        p >>= 7
        while p:
            chunk.append(0x80 | (p & 0x7F))
            p >>= 7
        body.extend(reversed(chunk))
    return _tlv(0x06, bytes(body))


def _build_request(pdu_tag, community, oid, request_id):
    varbind = _tlv(0x30, _oid(oid) + b"\x05\x00")
    pdu = _tlv(pdu_tag, _int(request_id) + _int(0) + _int(0) + _tlv(0x30, varbind))
    return _tlv(0x30, _int(1) + _tlv(0x04, community.encode()) + pdu)


# ---- BER decode ------------------------------------------------------------
def _read(data, pos):
    tag, size = data[pos], data[pos + 1]
    pos += 2
    if size & 0x80:
        count = size & 0x7F
        size = int.from_bytes(data[pos:pos + count], "big")
        pos += count
    return tag, data[pos:pos + size], pos + size


def _items(body):
    pos = 0
    while pos < len(body):
        tag, value, pos = _read(body, pos)
        yield tag, value


def _decode_oid(raw):
    parts, acc = [raw[0] // 40, raw[0] % 40], 0
    for byte in raw[1:]:
        acc = (acc << 7) | (byte & 0x7F)
        if not byte & 0x80:
            parts.append(acc)
            acc = 0
    return ".".join(map(str, parts))


def _decode_value(tag, raw, as_bytes=False):
    if tag == 0x40:                      # IpAddress
        return ".".join(map(str, raw))
    if tag in _UNSIGNED:
        return int.from_bytes(raw, "big")
    if tag == 0x02:
        return int.from_bytes(raw, "big", signed=True)
    if tag == 0x04:
        return raw if as_bytes else raw.decode("utf-8", "replace")
    if tag == 0x06:
        return _decode_oid(raw)
    return None


def _parse_response(data, as_bytes=False):
    _, message, _ = _read(data, 0)
    pdu = list(_items(message))[2][1]
    fields = list(_items(pdu))
    if int.from_bytes(fields[1][1], "big"):
        raise SnmpError("SNMP error-status %d" % int.from_bytes(fields[1][1], "big"))
    varbind = next(_items(fields[3][1]))[1]
    (_, oid_raw), (tag, value_raw) = list(_items(varbind))
    if tag in _END_MARKERS:
        return _decode_oid(oid_raw), None
    return _decode_oid(oid_raw), _decode_value(tag, value_raw, as_bytes)


# ---- Client ----------------------------------------------------------------
class SnmpClient:
    def __init__(self, host, community, timeout=2, port=161):
        self.host, self.community, self.timeout, self.port = host, community, timeout, port
        self.requests = 0                # đếm số gói SNMP đã gửi (hiển thị "PDUs")

    def _request(self, sock, pdu_tag, oid, as_bytes=False):
        self.requests += 1
        rid = random.randint(1, 2**31 - 1)
        sock.sendto(_build_request(pdu_tag, self.community, oid, rid), (self.host, self.port))
        data, _ = sock.recvfrom(65535)
        return _parse_response(data, as_bytes)

    def _socket(self):
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.settimeout(self.timeout)
        return sock

    def get(self, oid):
        """Đọc một OID. Ném OSError (timeout) hoặc SnmpError."""
        with self._socket() as sock:
            return self._request(sock, GET, oid)[1]

    def walk(self, base, as_bytes=False):
        """Duyệt cây OID, trả về {chỉ số cuối: giá trị}."""
        result, current, prefix = {}, base, base + "."
        with self._socket() as sock:
            while True:
                oid, value = self._request(sock, GETNEXT, current, as_bytes)
                if value is None or not oid.startswith(prefix):
                    return result
                result[oid[len(prefix):]] = value
                current = oid
