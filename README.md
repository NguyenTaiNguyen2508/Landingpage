# Landing page Fonez

Trang giới thiệu Fonez bằng tiếng Việt, dùng HTML, CSS và JavaScript thuần. Ảnh giao diện, phông chữ và video giới thiệu nằm trong thư mục này.

## Xem tại máy

Mở `index.html` để xem trang và phát video giới thiệu. Để xem cả hai bài hướng dẫn YouTube ngay trong trang, chạy máy chủ tĩnh từ thư mục gốc của repo rồi mở địa chỉ bên dưới.

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

[http://127.0.0.1:4173](http://127.0.0.1:4173)

## Đăng lên Vercel

Giữ **Root Directory** ở thư mục gốc của repo, chọn **Framework Preset** là **Other**, để trống **Build Command** và dùng `.` cho **Output Directory**. Khi dùng dịch vụ lưu trữ tĩnh khác, đăng các tệp của trang cùng `media/`, `fonts/` và `Fonez Introduction.mp4`.

## Video và liên kết

Các nút tải trong `index.html` dẫn đến thư mục Google Drive phát hành Fonez. Mục video có liên kết đến [kênh FONEZ Platform](https://www.youtube.com/@FONEZPlatform) và từng bài hướng dẫn. Phần giới thiệu dùng tệp MP4 tại chỗ. Trên HTTP hoặc HTTPS, khi người xem chọn bài hướng dẫn, `app.js` mới tạo trình phát YouTube. Khi mở trang từ tệp, các bài này mở trên YouTube.
