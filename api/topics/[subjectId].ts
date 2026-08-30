import { VercelRequest, VercelResponse } from '@vercel/node'

const BACKEND = 'https://admin-moderator-backend-staging.up.railway.app/api'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { subjectId } = req.query
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(req.headers.authorization && { 'Authorization': req.headers.authorization as string }),
    }

    const response = await fetch(`${BACKEND}/topics/${subjectId}`, {
      method: req.method,
      headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    })

    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}
