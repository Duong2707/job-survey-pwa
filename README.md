# Student Job Survey PWA

Ứng dụng Progressive Web App (PWA) hỗ trợ khảo sát nhu cầu việc làm của sinh viên.

## 1. Giới thiệu

Student Job Survey PWA được xây dựng nhằm hỗ trợ thu thập thông tin về nhu cầu việc làm của sinh viên trong quá trình khảo sát thực tế.

Ứng dụng cho phép người dùng:

- Nhập thông tin sinh viên.
- Trả lời các câu hỏi khảo sát.
- Ghi nhận vị trí GPS.
- Chụp hoặc chọn ảnh khảo sát.
- Nhập ý kiến và phản hồi.
- Lưu dữ liệu khi không có Internet.
- Tự động đồng bộ dữ liệu lên Google Sheets khi có Internet.

## 2. Công nghệ sử dụng

- React
- Vite
- JavaScript
- Dexie.js
- IndexedDB
- Progressive Web App (PWA)
- Service Worker
- Geolocation API
- Camera / Media Capture
- Vercel
- Google Apps Script
- Google Sheets

## 3. Chức năng chính

### Khảo sát

Người dùng có thể nhập:

- Họ tên sinh viên
- Ngành học
- Năm học
- Nhu cầu tìm việc
- Lĩnh vực công việc
- Hình thức làm việc
- Mức lương mong muốn
- Khó khăn khi tìm việc
- Ý kiến / phản hồi

### GPS

Ứng dụng sử dụng Geolocation API để ghi nhận:

- Vĩ độ
- Kinh độ
- Độ chính xác

### Ảnh

Người dùng có thể chụp hoặc chọn ảnh từ thiết bị.

Ảnh được lưu cùng dữ liệu khảo sát và gửi lên hệ thống khi đồng bộ.

### Offline-first

Khi mất Internet, dữ liệu khảo sát được lưu trên thiết bị bằng IndexedDB thông qua Dexie.js.

Khi thiết bị có Internet trở lại, các khảo sát đang chờ sẽ được tự động đồng bộ.

### Google Sheets

Dữ liệu khảo sát được gửi qua API:

```text
React PWA
    ↓
Vercel API
    ↓
Google Apps Script
    ↓
Google Sheets
