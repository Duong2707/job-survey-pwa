export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    })
  }

  try {
    const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwUPTVnxxTuBJkRpPKrAVnmPArqvE3X7Fw8WW_rkCX2a6CqLxlNGOctQXmVGWnyZr1tyA/exec'

    const data = req.body

    // Gửi POST sang Google Apps Script
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        payload: JSON.stringify(data),
      }).toString(),
      redirect: 'follow',
    })

    const text = await response.text()

    console.log('Google response:', response.status, text)

    let result

    try {
      result = JSON.parse(text)
    } catch {
      return res.status(502).json({
        success: false,
        message: 'Google Apps Script không trả JSON',
        raw: text,
      })
    }

    if (!result.success) {
      return res.status(502).json({
        success: false,
        message: result.message || 'Google Apps Script báo lỗi',
      })
    }

    return res.status(200).json(result)

  } catch (error) {
    console.error('Sync error:', error)

    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi kết nối Google Apps Script',
    })
  }
}