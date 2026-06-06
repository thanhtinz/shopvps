// Bỏ qua việc tải Chrome đi kèm lúc cài đặt.
// puppeteer được khai báo trong dependencies nhưng KHÔNG được dùng trong code,
// và môi trường build trên Railway không tải/giải nén được trình duyệt.
module.exports = { skipDownload: true };
