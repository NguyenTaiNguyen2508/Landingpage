# Test.It Landing Page

Static landing page để deploy lên Vercel, viết theo hướng ít chữ, nhiều motion và giới thiệu Realtime, Backtest, AI Research.

## Chạy local

Mở trực tiếp file:

```text
landing/index.html
```

Hoặc chạy static server nếu muốn xem qua localhost:

```powershell
cd landing
python -m http.server 4173
```

Sau đó mở `http://localhost:4173`.

## Gắn link download

Link hiện tại đã được gắn trong `landing/app.js` và các nút tải ở `landing/index.html`:

```html
<a href="https://drive.google.com/drive/folders/1t51CWXzwToFCee7DxN9S__ElGJalc30z?usp=sharing">
```

Sau này có thể thay bằng link Vercel Blob, Google Drive public, GitHub Release, S3/R2 hoặc link từ VPS.

## Deploy Vercel

1. Tạo project Vercel mới.
2. Chọn thư mục root là `landing`.
3. Framework preset: `Other`.
4. Build command: để trống.
5. Output directory: để trống hoặc `.`.

Vercel sẽ serve `index.html` như một static site.
