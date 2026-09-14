import { useEffect, useState } from 'react'
import { db } from './db'
import './App.css'
 const API_URL = '/api/survey'
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result

      // result có dạng:
      // data:image/jpeg;base64,xxxxx
      const base64 = result.split(',')[1]

      resolve(base64)
    }

    reader.onerror = reject

    reader.readAsDataURL(file)
  })
}
const sendSurveyToGoogleSheet = async (survey) => {
  let photoData = null

  if (survey.photo) {
    const base64 = await fileToBase64(survey.photo)

    photoData = {
      base64,
      mimeType: survey.photo.type || 'image/jpeg',
      fileName: survey.photo.name || 'survey-photo.jpg',
    }
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: survey.id,
      name: survey.name,
      major: survey.major,
      year: survey.year,
      needJob: survey.needJob,
      field: survey.field,
      workType: survey.workType,
      salary: survey.salary,
      difficulty: survey.difficulty,
      feedback: survey.feedback,
      latitude: survey.latitude,
      longitude: survey.longitude,
      accuracy: survey.accuracy,
      timestamp: survey.timestamp,
      photo: photoData,
    }),
  })

  if (!response.ok) {
    throw new Error(`API lỗi: HTTP ${response.status}`)
  }

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.message || 'Không thể đồng bộ')
  }

  return result
}
function App() {
  const [showForm, setShowForm] = useState(false)
  const [surveys, setSurveys] = useState([])
  const [isOnline, setIsOnline] = useState(navigator.onLine)
const [photo, setPhoto] = useState(null)
  const [form, setForm] = useState({
  name: '',
  major: '',
  year: '',
  needJob: '',
  field: '',
  workType: '',
  salary: '',
  difficulty: '',
  feedback: '',
  latitude: null,
  longitude: null,
  accuracy: null,
})
const [locationStatus, setLocationStatus] = useState('Chưa lấy vị trí')
const [locationLoading, setLocationLoading] = useState(false)

  // Theo dõi trạng thái Internet
  useEffect(() => {
    const online = () => setIsOnline(true)
    const offline = () => setIsOnline(false)

    window.addEventListener('online', online)
    window.addEventListener('offline', offline)

    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offline)
    }
  }, [])
  const syncPendingSurveys = async () => {
  if (!navigator.onLine) return

  const pendingSurveys = await db.surveys
    .where('syncStatus')
    .equals('pending')
    .toArray()

  for (const survey of pendingSurveys) {
    try {
      await sendSurveyToGoogleSheet(survey)

      await db.surveys.update(survey.id, {
        syncStatus: 'synced',
      })

      console.log('Đã đồng bộ:', survey.id)
    } catch (error) {
      console.error(
        'Không đồng bộ được:',
        survey.id,
        error
      )
    }
  }

  loadSurveys()
}
useEffect(() => {
  syncPendingSurveys()

  const handleOnline = () => {
    console.log('Có mạng trở lại → bắt đầu đồng bộ')
    syncPendingSurveys()
  }

  window.addEventListener('online', handleOnline)

  return () => {
    window.removeEventListener('online', handleOnline)
  }
}, [])
  // Lấy dữ liệu đã lưu trong IndexedDB
  const loadSurveys = async () => {
    const data = await db.surveys.orderBy('timestamp').reverse().toArray()
    setSurveys(data)
  }

  useEffect(() => {
    loadSurveys()
  }, [])

  // Xử lý nhập dữ liệu
  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((oldForm) => ({
      ...oldForm,
      [name]: value,
    }))
  }
const getLocation = () => {
  if (!navigator.geolocation) {
    setLocationStatus('Thiết bị không hỗ trợ GPS')
    return
  }

  setLocationLoading(true)
  setLocationStatus('Đang lấy vị trí...')

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords

      setForm((oldForm) => ({
        ...oldForm,
        latitude,
        longitude,
        accuracy,
      }))

      setLocationStatus('Đã lấy vị trí thành công')
      setLocationLoading(false)
    },
    (error) => {
  console.error(error)

  setForm((oldForm) => ({
    ...oldForm,
    latitude: null,
    longitude: null,
    accuracy: null,
  }))

  setLocationStatus(
    'Không thể lấy vị trí mới. Vui lòng thử lại.'
  )

  setLocationLoading(false)
},  
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  )
}
const handlePhotoChange = (e) => {
  const file = e.target.files?.[0]

  if (!file) return

  const previewUrl = URL.createObjectURL(file)

  setPhoto({
    file,
    previewUrl,
  })
}
  // Lưu khảo sát
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name.trim()) {
      alert('Vui lòng nhập tên sinh viên!')
      return
    }

    const survey = {
      id: crypto.randomUUID(),

      name: form.name,
      major: form.major,
      year: form.year,

      needJob: form.needJob,
      field: form.field,
      workType: form.workType,
      salary: form.salary,

      difficulty: form.difficulty,
      feedback: form.feedback,

      timestamp: new Date().toISOString(),

      latitude: form.latitude,
longitude: form.longitude,
accuracy: form.accuracy,

photo: photo ? photo.file : null,

      syncStatus: 'pending',
    }

    try {
      await db.surveys.add(survey)
      if (navigator.onLine) {
  try {
    await sendSurveyToGoogleSheet(survey)

    await db.surveys.update(survey.id, {
      syncStatus: 'synced',
    })
  } catch (error) {
    console.error('Sync failed:', error)

    await db.surveys.update(survey.id, {
      syncStatus: 'pending',
    })
  }
}
if (photo) {
  URL.revokeObjectURL(photo.previewUrl)
  setPhoto(null)
}
      alert(
  isOnline
    ? 'Đã lưu và đồng bộ khảo sát lên Google Sheet!'
    : 'Đã lưu khảo sát OFFLINE trên thiết bị!'
)

      setForm({
  name: '',
  major: '',
  year: '',
  needJob: '',
  field: '',
  workType: '',
  salary: '',
  difficulty: '',
  feedback: '',
  latitude: null,
  longitude: null,
  accuracy: null,
})

      await loadSurveys()

      setShowForm(false)
    } catch (error) {
      console.error(error)
      alert('Có lỗi khi lưu khảo sát!')
    }
  }

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <div>
          <h1>Student Job Survey</h1>
          <p>Khảo sát nhu cầu việc làm của sinh viên</p>
        </div>

        <div className={`status ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </div>
      </header>

      <main className="container">

        {/* TRANG CHÍNH */}
        {!showForm ? (
          <>
            <section className="welcome">

              <h2>Khảo sát nhu cầu việc làm</h2>

              <p>
                Thu thập thông tin về nhu cầu, mong muốn và
                định hướng việc làm của sinh viên.
              </p>

              {!isOnline && (
                <div className="offline-message">
                  🔴 Không có Internet.
                  <br />
                  Bạn vẫn có thể thực hiện khảo sát.
                  <br />
                  Dữ liệu sẽ được lưu trên thiết bị và
                  đồng bộ khi có mạng.
                </div>
              )}

              <button
                className="primary-button"
                onClick={() => setShowForm(true)}
              >
                + Bắt đầu khảo sát
              </button>

            </section>

            {/* THỐNG KÊ */}
            <section className="stats">

              <div className="stat-card">
                <span>📋</span>
                <strong>{surveys.length}</strong>
                <p>Khảo sát</p>
              </div>

              <div className="stat-card">
                <span>☁️</span>
                <strong>
                  {surveys.filter(
                    (survey) => survey.syncStatus === 'synced'
                  ).length}
                </strong>
                <p>Đã đồng bộ</p>
              </div>

              <div className="stat-card">
                <span>📤</span>
                <strong>
                  {surveys.filter(
                    (survey) => survey.syncStatus === 'pending'
                  ).length}
                </strong>
                <p>Chờ đồng bộ</p>
              </div>

            </section>

            {/* DANH SÁCH */}
            {surveys.length > 0 && (
              <section className="survey-list">

                <h2>Khảo sát gần đây</h2>

                {surveys.map((survey) => (
                  <div className="survey-item" key={survey.id}>

                    <div>
                      <strong>{survey.name}</strong>

                      <p>
                        {survey.major || 'Chưa nhập ngành'}
                        {' • '}
                        {survey.field || 'Chưa chọn lĩnh vực'}
                      </p>

                      <small>
                        {new Date(survey.timestamp).toLocaleString('vi-VN')}
                      </small>
                    </div>

                    <span>
                      {survey.syncStatus === 'synced'
                        ? '☁️ Đã đồng bộ'
                        : '📤 Chờ đồng bộ'}
                    </span>

                  </div>
                ))}

              </section>
            )}

          </>
        ) : (

          /* FORM */
          <section className="survey-form">

            <button
              className="back-button"
              onClick={() => setShowForm(false)}
            >
              ← Quay lại
            </button>

            <h2>Thông tin khảo sát</h2>

            <form onSubmit={handleSubmit}>

              <div className="form-group">
                <label>Họ và tên sinh viên *</label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  type="text"
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div className="form-group">
                <label>Ngành học</label>

                <input
                  name="major"
                  value={form.major}
                  onChange={handleChange}
                  type="text"
                  placeholder="Ví dụ: Công nghệ thông tin"
                />
              </div>

              <div className="form-group">
                <label>Năm học</label>

                <select
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                >
                  <option value="">Chọn năm học</option>
                  <option value="Năm 1">Năm 1</option>
                  <option value="Năm 2">Năm 2</option>
                  <option value="Năm 3">Năm 3</option>
                  <option value="Năm 4">Năm 4</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  Bạn có nhu cầu tìm việc không?
                </label>

                <select
                  name="needJob"
                  value={form.needJob}
                  onChange={handleChange}
                >
                  <option value="">Chọn câu trả lời</option>
                  <option value="Có">Có</option>
                  <option value="Không">Không</option>
                  <option value="Đang tìm hiểu">
                    Đang tìm hiểu
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label>Lĩnh vực muốn làm việc</label>

                <select
                  name="field"
                  value={form.field}
                  onChange={handleChange}
                >
                  <option value="">Chọn lĩnh vực</option>
                  <option value="Software Developer">
                    Software Developer
                  </option>
                  <option value="Web Developer">
                    Web Developer
                  </option>
                  <option value="Data">Data</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Design">Design</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="form-group">
                <label>Hình thức làm việc mong muốn</label>

                <select
                  name="workType"
                  value={form.workType}
                  onChange={handleChange}
                >
                  <option value="">Chọn hình thức</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>

              <div className="form-group">
                <label>Mức lương mong muốn</label>

                <input
                  name="salary"
                  value={form.salary}
                  onChange={handleChange}
                  type="text"
                  placeholder="Ví dụ: 10 - 15 triệu"
                />
              </div>

              <div className="form-group">
                <label>Khó khăn khi tìm việc</label>

                <textarea
                  name="difficulty"
                  value={form.difficulty}
                  onChange={handleChange}
                  placeholder="Nhập câu trả lời..."
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Cảm nghĩ / đề xuất của sinh viên</label>

                <textarea
                  name="feedback"
                  value={form.feedback}
                  onChange={handleChange}
                  placeholder="Nhập cảm nghĩ..."
                  rows="4"
                />
              </div>

              {/* LOCATION - làm ở bước sau */}
              <div className="location-box">
  <h3>📍 Vị trí khảo sát</h3>

  <p>{locationStatus}</p>

  {form.latitude != null && form.longitude != null ? (
  <div className="location-result">
    <p>
      <strong>Vĩ độ:</strong> {form.latitude.toFixed(6)}
    </p>

    <p>
      <strong>Kinh độ:</strong> {form.longitude.toFixed(6)}
    </p>

    <p>
      <strong>Độ chính xác:</strong>{' '}
      {form.accuracy != null
        ? Math.round(form.accuracy)
        : 'Không xác định'} mét
    </p>
  </div>
) : (
  <div className="location-unavailable">
    📍 Chưa có vị trí GPS
    <br />
    <small>
      Có thể thử lại trên điện thoại khi bật Location.
    </small>
  </div>
)}

  <button
    type="button"
    className="secondary-button"
    onClick={getLocation}
    disabled={locationLoading}
  >
    {locationLoading
      ? '⏳ Đang lấy vị trí...'
      : '📍 Lấy vị trí hiện tại'}
  </button>
</div>

              {/* CAMERA - làm ở bước sau */}
             <div className="photo-box">
  <h3>📷 Ảnh hiện trường</h3>

  <input
    id="photo"
    type="file"
    accept="image/*"
    capture="environment"
    hidden
    onChange={handlePhotoChange}
  />

  <label
    htmlFor="photo"
    className="secondary-button photo-button"
  >
    📷 Chụp ảnh
  </label>

  {photo && (
    <div className="photo-preview">
      <img
        src={photo.previewUrl}
        alt="Ảnh khảo sát"
      />

      <button
        type="button"
        onClick={() => {
          URL.revokeObjectURL(photo.previewUrl)
          setPhoto(null)
        }}
      >
        Xóa ảnh
      </button>
    </div>
  )}

  {!photo && (
    <p>Chưa có ảnh.</p>
  )}
</div>

              <button
                type="submit"
                className="primary-button save-button"
              >
                💾 Lưu khảo sát
              </button>

            </form>

          </section>
        )}

      </main>
    </div>
  )
}

export default App