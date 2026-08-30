const BACKEND = 'https://admin-moderator-backend-staging.up.railway.app/api'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const { id } = req.query
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
    }

    const response = await fetch(`${BACKEND}/questions/${id}`, {
      method: req.method,
      headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    })

    const text = await response.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = { error: text || 'Invalid response from backend' }
    }

    res.status(response.status).json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
