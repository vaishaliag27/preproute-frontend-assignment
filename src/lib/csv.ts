import type { OptionKey, QuestionDraft } from '../types'

/** Parses RFC4180-ish CSV text, honouring quoted fields and embedded commas. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      // Swallow the \n of a \r\n pair.
      if (char === '\r' && text[index + 1] === '\n') index += 1
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((entry) => entry.some((cell) => cell.trim() !== ''))
}

const CSV_TEMPLATE_HEADERS = [
  'question',
  'option1',
  'option2',
  'option3',
  'option4',
  'correct_option',
  'explanation',
  'difficulty',
]

const OPTION_KEYS: OptionKey[] = ['option1', 'option2', 'option3', 'option4']

interface CsvImportResult {
  questions: QuestionDraft[]
  skipped: number
}

/**
 * Maps a CSV export into question drafts. Expected header row:
 * `question, option1..option4, correct_option, explanation, difficulty`.
 * `correct_option` accepts `option2`, `2`, or `B`.
 */
export function csvToQuestions(text: string, testId: string): CsvImportResult {
  const rows = parseCsv(text)
  if (rows.length === 0) return { questions: [], skipped: 0 }

  const header = rows[0].map((cell) => cell.trim().toLowerCase())
  const hasHeader = header.includes('question')
  const columns = hasHeader ? header : CSV_TEMPLATE_HEADERS
  const body = hasHeader ? rows.slice(1) : rows

  const at = (row: string[], name: string) => {
    const index = columns.indexOf(name)
    return index === -1 ? '' : (row[index] ?? '').trim()
  }

  const questions: QuestionDraft[] = []
  let skipped = 0

  for (const row of body) {
    const question = at(row, 'question')
    const options = OPTION_KEYS.map((key) => at(row, key))
    if (!question || options.some((option) => !option)) {
      skipped += 1
      continue
    }

    const rawCorrect = at(row, 'correct_option').toLowerCase()
    let correct: OptionKey | null = null
    if (OPTION_KEYS.includes(rawCorrect as OptionKey)) {
      correct = rawCorrect as OptionKey
    } else if (/^[1-4]$/.test(rawCorrect)) {
      correct = OPTION_KEYS[Number(rawCorrect) - 1]
    } else if (/^[a-d]$/.test(rawCorrect)) {
      correct = OPTION_KEYS[rawCorrect.charCodeAt(0) - 97]
    }

    if (!correct) {
      skipped += 1
      continue
    }

    const difficulty = at(row, 'difficulty').toLowerCase()

    questions.push({
      type: 'mcq',
      question,
      option1: options[0],
      option2: options[1],
      option3: options[2],
      option4: options[3],
      correct_option: correct,
      explanation: at(row, 'explanation') || undefined,
      difficulty: ['easy', 'medium', 'difficult'].includes(difficulty)
        ? difficulty
        : undefined,
      topic: null,
      sub_topic: null,
      media_url: null,
      test_id: testId,
    })
  }

  return { questions, skipped }
}
