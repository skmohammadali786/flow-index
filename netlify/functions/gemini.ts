import fetch from 'node-fetch'

export async function handler(event) {
  const body = JSON.parse(event.body || '{}')

  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.GEMINI_API_KEY,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  )

  const data = await res.json()
  return {
    statusCode: 200,
    body: JSON.stringify(data)
  }
}
