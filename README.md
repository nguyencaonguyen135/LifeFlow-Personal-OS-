# LifeFlow – Personal OS

LifeFlow là ứng dụng quản lý cuộc sống cá nhân được xây dựng với React, TypeScript, Vite và Zustand. Ứng dụng lưu dữ liệu cục bộ trong trình duyệt, phù hợp để theo dõi các hoạt động hằng ngày mà không cần backend.

## Các module hiện có

- Tổng quan dashboard
- Tài chính: tài khoản, giao dịch, ngân sách, tiết kiệm và công nợ
- Công việc và dự án
- Lịch trình
- Học tập và Pomodoro
- Thói quen và streak
- Sức khỏe: giấc ngủ, nước uống, vận động và tâm trạng
- Mục tiêu cá nhân
- Báo cáo tổng hợp
- Sao lưu và khôi phục dữ liệu JSON
- Dark mode và responsive layout

## Chạy local

Yêu cầu Node.js 22 trở lên.

```bash
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal, thường là `http://localhost:5173`.

## Kiểm tra trước khi deploy

```bash
npm run lint
npm run build
```

`npm run build` tạo bản production trong thư mục `dist`.

## Deploy GitHub Pages

Project đã có thể deploy bằng GitHub Actions. Trong [vite.config.ts](./vite.config.ts), đặt `base` theo tên repository:

```ts
base: '/LifeFlow-Personal-OS-/',
```

Sau đó tạo file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    runs-on: ubuntu-latest
    needs: build
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Trong GitHub, vào **Settings → Pages → Build and deployment**, chọn **GitHub Actions**.

## Lưu ý dữ liệu

Dữ liệu được lưu bằng `localStorage` trên từng trình duyệt và thiết bị. Hãy dùng **Cài đặt → Xuất dữ liệu** để tạo bản sao lưu trước khi xóa dữ liệu trình duyệt hoặc chuyển thiết bị.
