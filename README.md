# Landing page Fonez

Trang giới thiệu Fonez bằng tiếng Việt, dùng HTML, CSS và JavaScript thuần. Ảnh giao diện, phông chữ và video giới thiệu nằm trong thư mục này.

## Xem tại máy

Mở `index.html` để xem trang và phát video giới thiệu. Để xem cả hai bài hướng dẫn YouTube ngay trong trang, chạy máy chủ tĩnh từ thư mục gốc của repo rồi mở địa chỉ bên dưới.

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

[http://127.0.0.1:4173](http://127.0.0.1:4173)

## Đăng lên Vercel

Giữ **Root Directory** ở thư mục gốc của repo, chọn **Framework Preset** là **Other**, để trống **Build Command** và dùng `.` cho **Output Directory**. Vercel tự nhận Node.js Function trong `api/download.js`, không cần thêm dependency hay build. Khi dùng dịch vụ lưu trữ tĩnh khác, đăng các tệp của trang cùng `media/`, `fonts/` và `Fonez Introduction.mp4`; xem lưu ý về phiên bản tải bên dưới.

## Video và liên kết

Mục video có liên kết đến [kênh FONEZ Platform](https://www.youtube.com/@FONEZPlatform) và từng bài hướng dẫn. Phần giới thiệu dùng tệp MP4 tại chỗ. Trên HTTP hoặc HTTPS, khi người xem chọn bài hướng dẫn, `app.js` mới tạo trình phát YouTube. Khi mở trang từ tệp, các bài này mở trên YouTube.

## Tải trực tiếp và hướng dẫn mở ứng dụng

Các nút **Tải Fonez** mở cùng một popover hướng dẫn. Nút **Tải Fonez.exe** bên trong tải trực tiếp qua HTTPS từ Gateway Oracle, không mở Google Drive. Windows có thể vẫn hỏi vị trí lưu hoặc cảnh báo về tệp tải xuống theo cài đặt của người dùng.

- Trên Vercel, `app.js` gọi `/api/download?metadata=1` khi mở hướng dẫn để cập nhật phiên bản, dung lượng và URL tải. Function đọc manifest `stable` ở Gateway phía server vì Gateway chưa cho phép CORS từ landing. File EXE đi thẳng từ Oracle đến người tải, không đi qua Vercel.
- `/api/download` (không có `metadata=1`) chuyển hướng HTTP 302 tới bản stable hiện tại. URL đầu ra bị giới hạn ở artifact HTTPS của Gateway; không nhận URL đích từ người dùng.
- Khi mở bằng `file://`, máy chủ tĩnh, hoặc không lấy được metadata, nút tải dùng URL artifact đã xác minh của **v1.1.0 (98.377.216 byte)** được ghi sẵn trong HTML. Trang không gọi đây là bản mới nhất nếu chưa kiểm tra được. Khi phát hành bản mới cho hosting tĩnh, cập nhật URL và thông tin dự phòng trong `index.html`, cùng thông báo phiên bản dự phòng trong `app.js`.
- Hướng dẫn phân biệt SmartScreen với Smart App Control, và trình bày từng bước thêm ngoại lệ cho đúng thư mục Fonez khi đã xác minh cảnh báo. Không tự thay đổi cài đặt bảo mật trên máy người dùng. Hướng dẫn vẫn đọc được và nút tải dự phòng vẫn dùng được khi JavaScript bị tắt.

Nguồn đối chiếu cho nội dung hướng dẫn (không thay thế các bước trong popover): [Smart App Control – Quantrimang](https://quantrimang.com/cong-nghe/windows-11-phong-ngua-phan-mem-doc-hai-188265), [ngoại lệ Defender – Quantrimang](https://quantrimang.com/cong-nghe/them-ngoai-le-trong-windows-defender-172110), [Smart App Control – Microsoft](https://support.microsoft.com/en-us/windows/security/threat-malware-protection/smart-app-control-frequently-asked-questions), [Virus & threat protection – Microsoft](https://support.microsoft.com/en-us/windows/security/threat-malware-protection/virus-and-threat-protection-in-the-windows-security-app). Thông tin bật lại Smart App Control ưu tiên tài liệu Microsoft mới hơn: các bản Windows mới hỗ trợ bật lại mà không cần cài lại hệ điều hành.

## Hai bản Portable và MSI

Popover tải có hai lựa chọn song song: **Portable** (EXE, không cài đặt) và **Bản cài đặt MSI** (chọn thư mục, mở từ Start Menu). Chuyển lựa chọn sẽ đổi đúng hướng dẫn và nút tải; các phản hồi metadata đến muộn không được đổi lựa chọn người dùng.

- `/api/download?format=portable` giữ nguyên kênh EXE; bỏ `format` cũng mặc định Portable để tương thích các link cũ.
- `/api/download?format=msi` đọc `/v1/app-installers/stable`, kiểm tra định dạng MSI và chỉ trả URL artifact `.msi` của Gateway. Thêm `metadata=1` để nhận JSON thay vì chuyển hướng.
- Gateway trả 204 khi chưa phát hành MSI: giao diện báo chưa có MSI và giữ lựa chọn Portable dùng được. Lỗi mạng không tự đổi MSI thành EXE.
- Trên hosting tĩnh hoặc khi mở file, MSI dùng `https://fonez.duckdns.org/v1/app-installers/download`; Gateway quyết định bản hiện hành tại lúc bấm. Link này chỉ hoạt động sau khi Gateway đã triển khai kênh MSI và đã có MSI phát hành. Portable vẫn giữ URL EXE dự phòng đã xác minh.
- Không thay đổi giao thức cập nhật trong app. MSI là kênh cài đặt mới; sau khi cài, Fonez tiếp tục cập nhật bằng EXE.

## Hoa hồng giới thiệu / Affiliate

Mục `#affiliate` giới thiệu ngắn chương trình; `#details-affiliate` mở bằng cùng popover “Xem thêm” của các tính năng. Nội dung dựa trên `ai_gateway/referral.py`, `ai_gateway/payment.py`, giao diện `static/js/license_ui.js` và các trường chính sách chung trong `billing_settings` trên Oracle, đọc ở chế độ chỉ đọc ngày **22/11/2026**. Không đọc hoặc sao chép dữ liệu người giới thiệu, đơn hàng hay tài khoản ngân hàng.

Chính sách chung tại thời điểm đối chiếu: chương trình đang bật; tặng 7 ngày Realtime khi đăng ký qua mã hợp lệ; 30% cho đơn Realtime trực tiếp đầu tiên đủ điều kiện từ 100.000đ thực nhận; 10% cho Realtime tiếp theo đủ điều kiện và credit AI; 5% cấp hai. Realtime dưới ngưỡng không có hoa hồng trực tiếp và không tiêu thụ mức đầu tiên. Hoa hồng chờ đối soát trước khi chi trả; người nhận cần bổ sung đủ thông tin ngân hàng. Không cam kết lịch trả, ngưỡng rút hay tự động chuyển tiền khi hệ thống không quy định.

Đây là nội dung tĩnh, không tự đồng bộ cấu hình Gateway và không thay đổi chính sách của app. Khi đổi tỷ lệ, điều kiện hoặc số ngày thưởng, cập nhật cả phần giới thiệu và popover, cùng ngày đối chiếu. Chính sách riêng và thay đổi về sau cần xem lại trong Tài khoản Fonez → Chương trình giới thiệu. Các luồng Portable/MSI và tám popover tính năng cũ được giữ nguyên.
