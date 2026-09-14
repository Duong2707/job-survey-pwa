export default async function handler(req, res) {
  // Chỉ cho phép POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    })
  }

  try {
    // URL Web App Google Apps Script
    const GOOGLE_SCRIPT_URL =
      'https://script.google.com/macros/s/AKfycbyDO9tJjSvFIvygltTsdR4rbHd1RT_2MNjYTt93ybKxANUAQ0M6zL64AUTCbFkpNzGySA/exec'

    // Lấy dữ liệu từ React
    const data = req.body

    // Gửi tiếp sang Google Apps Script
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        payload: JSON.stringify(data),
      }).toString(),
    })

    const text = await response.text()

    let result

    try {
      result = JSON.parse(text)
    } catch {
      result = {
        success: false,
        message: 'Google Apps Script trả về dữ liệu không hợp lệ',
        raw: text,
      }
    }

    if (!response.ok) {
      return res.status(response.status).json(result)
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('API proxy error:', error)

    return res.status(500).json({
      success: false,
      message: error.message || 'Không thể kết nối Google Apps Script',
    })
  }
}