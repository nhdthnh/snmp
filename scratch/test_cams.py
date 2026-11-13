import subprocess
import concurrent.futures

ips = [
    ("D01", "Phong lam viec", "192.168.4.101"),
    ("D02", "Phong lam viec_2", "192.168.4.131"),
    ("D03", "Phong hop", "192.168.4.100"),
    ("D04", "Hanh lang van phong", "192.168.4.103"),
    ("D05", "Hanh lang xuong", "192.168.4.102"),
    ("D06", "Cua ra vao", "192.168.4.117"),
    ("D07", "Phong kiem nghiem", "192.168.4.107"),
    ("D08", "Hanh lang kho 1", "192.168.4.126"),
    ("D09", "Kho thanh pham", "192.168.4.124"),
    ("D10", "Kho nguyen lieu", "192.168.4.133"),
    ("D11", "Kho bao bi", "192.168.4.137"),
    ("D12", "Khu ky thuat", "192.168.4.109"),
    ("D13", "Hanh lang kho 2", "192.168.4.122"),
    ("D14", "Hang lang thoat hiem", "192.168.4.112"),
    ("D15", "Kho dung moi", "192.168.4.118"),
    ("D16", "Hanh lang san xuat 1", "192.168.4.130"),
    ("D17", "Hanh lang san xuat 2", "192.168.4.114"),
    ("D18", "Hanh lang san xuat 3", "192.168.4.132"),
    ("D19", "Phong IPC", "192.168.4.119"),
    ("D20", "Xu ly bao bi", "192.168.4.110"),
    ("D21", "Ve sinh bao bi ngoai", "192.168.4.111"),
    ("D22", "Phong can nguyen lieu", "192.168.4.108"),
    ("D23", "Phong pha hoa chat", "192.168.4.134"),
    ("D24", "Phong rua dung cu", "192.168.4.113"),
    ("D25", "Phong pha che 1", "192.168.4.123"),
    ("D26", "Phong pha che 2", "192.168.4.136"),
    ("D27", "Phong luu ban thanh pham 1_1", "192.168.4.116"),
    ("D28", "Phong u ban thanh pham 1_2", "192.168.4.121"),
    ("D29", "Phong du phong", "192.168.4.128"),
    ("D30", "Phong chiet rot", "192.168.4.115"),
    ("D31", "Phong dong goi 2_1", "192.168.4.129"),
    ("D32", "Phong dong goi 2_2", "192.168.4.127"),
]

def ping_one(item):
    chid, name, ip = item
    res = subprocess.run(["ping", "-n", "1", "-w", "1000", ip], capture_output=True, text=True)
    up = "TTL=" in res.stdout or "ttl=" in res.stdout
    return chid, name, ip, up

with concurrent.futures.ThreadPoolExecutor(max_workers=16) as ex:
    results = list(ex.map(ping_one, ips))

online = [r for r in results if r[3]]
offline = [r for r in results if not r[3]]

print(f"Total: {len(results)}, Online: {len(online)}, Offline: {len(offline)}")
for r in results:
    status = "UP" if r[3] else "DOWN"
    print(f"{r[0]} | {r[2]} | {r[1]:<30} | {status}")
