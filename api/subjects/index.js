const BACKEND = 'https://admin-moderator-backend-staging.up.railway.app/api'

export default async function handler(req, res) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
    }

    const response = await fetch(`${BACKEND}/subjects`, {
      method: req.method,
      headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    })

    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
