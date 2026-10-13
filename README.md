# Thiệp cưới Đình Duy & Hồng Nhung

Bản clone thiệp cưới online độc lập, lưu trữ toàn bộ tài nguyên cục bộ (hình ảnh, phông chữ, âm thanh) và lưu sổ lưu bút vào file JSON trên server riêng. Không chứa liên kết hay mã theo dõi của Chung Đôi.

## Yêu cầu

- **Node.js**: `>= 22.0.0`
- **npm**: đi kèm Node.js

## Cài đặt và khởi chạy

```bash
# Cài đặt (không có dependency bên ngoài, dùng module tích hợp của Node.js)
npm install

# Khởi chạy chế độ phát triển
npm run dev

# Hoặc khởi chạy production
npm start
```
## Triển khai Cloudflare Worker (qua Cloudflare CLI `cf`)

Dự án đã được cấu hình sẵn cho CLI `cf` mới nhất của Cloudflare kèm cơ sở dữ liệu Edge D1 SQLite:

```bash
# Chạy máy chủ mô phỏng Edge cục bộ với D1 & Static Assets
npm run cf:dev
# (Truy cập tại http://127.0.0.1:8787)

# Triển khai lên Cloudflare production
npm run deploy
# hoặc: cf deploy
```


Truy cập trang tại: [http://localhost:3000](http://localhost:3000)

### Biến môi trường tuỳ chọn

| Biến | Mặc định | Mô tả |
| --- | --- | --- |
| `PORT` | `3000` | Cổng HTTP server lắng nghe |
| `HOST` | `127.0.0.1` | Địa chỉ IP máy chủ lắng nghe |
| `DATA_DIR` | `./data` | Thư mục lưu trữ dữ liệu sổ lưu bút (`comments.json`) |

## Cấu trúc thư mục

```text
duy-nhung-wedding/
├── data/                      # Lưu trữ dữ liệu sổ lưu bút (tự động tạo khi chạy)
│   └── comments.json
├── public/                    # Tài nguyên tĩnh phục vụ trực tiếp cho trình duyệt
│   ├── fonts/                 # Phông chữ woff2, ttf (Playfair Display, Lora, EB Garamond, ...)
│   ├── images/                # Ảnh trang trí hoa, hộp quà, mã QR mừng cưới
│   ├── music/                 # Nhạc nền ("Beautiful In White")
│   ├── uploads/               # Ảnh cô dâu, chú rể và album cưới (8 ảnh chất lượng cao)
│   ├── animations.css         # Keyframe hoạt hoạ bung hoa, bay lá, lắc hộp quà
│   ├── app.css                # Tinh chỉnh giao diện, lớp responsive, trạng thái nhạc
│   ├── app.js                 # Xử lý tương tác: mở thiệp, album 3D, lightbox, nhạc, sổ lưu bút
│   ├── admin.html             # Trang quản trị sổ lưu bút (xem, tìm kiếm, xuất CSV, xoá lời chúc)
│   ├── index.html             # Khung DOM đầy đủ của thiệp cưới
│   └── reference.css          # Hệ thống utility CSS Tailwind/DaisyUI thu gọn
├── .gitignore
├── package.json
├── README.md
└── server.js                  # HTTP server thuần Node.js, hỗ trợ byte-range audio và API lưu bút
```

## Các tính năng chính

1. **Hiệu ứng mở thiệp chuẩn**:
   - Dấu niêm phong tim tan vỡ (`seal-break`) kèm vòng hào quang mở rộng (`seal-ring`).
   - Hai nhánh hoa ở góc bay vút về phía trước (`dragon-fly-forward`).
   - Âm thanh chuông mở thiệp đa âm tổng hợp qua Web Audio API.
   - Bung 32 chiếc lá với góc xoay ngẫu nhiên tại mốc 500 ms; phong bì bay lên (`envelope-away`) và biến mất hoàn toàn ở mốc 1.300 ms.
   - Hỗ trợ chế độ giảm chuyển động (`prefers-reduced-motion`) và mở trực tiếp qua URL `?open=1`.

2. **Album ảnh 3D & Lightbox**:
   - Băng chuyền 3D xoay vòng 8 ảnh cưới; hỗ trợ nút điều hướng, phím bấm, vuốt chuột / cảm ứng (đã xử lý chống kẹt kéo ảnh mặc định).
   - Tự động chuyển ảnh sau mỗi 4,5 giây khi rảnh tay.
   - Lightbox toàn màn hình: phóng to / thu nhỏ bằng con lăn hoặc đúp chuột, vuốt chuyển ảnh, điều hướng bàn phím (`←` / `→` / `Esc`).

3. **Âm nhạc & Đếm ngược**:
   - Phát nhạc nền kèm nút xoay đĩa CD và cột sóng âm hoạt hoạ ở góc màn hình.
   - Đồng hồ đếm ngược từng giây đến thời điểm tiệc cưới (10:30 Thứ Bảy, 28/11/2026).
   - Lịch tháng 11/2026 đánh dấu trái tim ngày cưới và nút thêm sự kiện Google Calendar.

4. **Sổ lưu bút & Hộp quà mừng**:
   - Form gửi lời chúc lưu bền vững vào file `data/comments.json` qua cơ chế ghi nguyên tử (atomic write).
   - Nút ma thuật 🪄 mở hộp gợi ý lời chúc có sẵn.
   - Hộp quà hiệu ứng 3D khi hover; mở popup hiển thị thông tin ngân hàng và mã QR thanh toán (Techcombank 1838399999 - TANG DINH DUY), có nút tải ảnh QR về máy.

5. **Trang quản trị Sổ Lưu Bút (`/admin`)**:
   - Đường dẫn: `/admin` (hoặc `/admin.html`).
   - Bảo vệ bằng mã PIN (mặc định: - ngày cưới, cấu hình được qua biến môi trường `ADMIN_PIN`).
   - Thống kê số lượng lời chúc, tìm kiếm tức thì theo tên hoặc nội dung.
   - Nút **Xuất file CSV** (tương thích font tiếng Việt UTF-8 BOM cho Microsoft Excel).
   - Xoá lời chúc rác / spam với hộp thoại xác nhận an toàn.
