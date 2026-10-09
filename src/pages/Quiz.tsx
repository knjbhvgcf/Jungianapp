import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { LikertScale } from '../components/LikertScale'
import { ProgressBar } from '../components/ProgressBar'
import { Seo } from '../components/Seo'
import { QUESTIONS } from '../data/questions'
import { needsFollowUp } from '../lib/clarify'
import { isQuizComplete, type Answers } from '../lib/scoring'
import { clearAnswers, loadAnswers, loadClarifyAnswers, markCompleted, saveAnswers } from '../lib/storage'

const ADVANCE_MS = 160

export function Quiz() {
  const navigate = useNavigate()
  const advanceTimer = useRef<number>(0)
  const [answers, setAnswers] = useState<Answers>(() => loadAnswers())
  const [index, setIndex] = useState(() => {
    const stored = loadAnswers()
    const firstUnanswered = QUESTIONS.findIndex((item) => stored[item.id] == null)
    return firstUnanswered === -1 ? 0 : firstUnanswered
  })
  const [showResume, setShowResume] = useState(() => {
    const stored = loadAnswers()
    const count = QUESTIONS.filter((item) => stored[item.id] != null).length
    return count > 0 && count < QUESTIONS.length
  })

  const answeredCount = useMemo(
    () => QUESTIONS.filter((item) => answers[item.id] != null).length,
    [answers],
  )
  const question = QUESTIONS[index]

  useEffect(() => {
    return () => window.clearTimeout(advanceTimer.current)
  }, [])

  if (!question) return null

  const currentValue = answers[question.id]
  const isLast = index === QUESTIONS.length - 1

  function goForward(nextAnswers: Answers) {
    if (nextAnswers[question.id] == null) return
    window.clearTimeout(advanceTimer.current)
    if (isLast) {
      if (!isQuizComplete(nextAnswers)) return
      markCompleted()
      navigate(needsFollowUp(nextAnswers, loadClarifyAnswers()) ? '/clarify' : '/results')
      return
    }
    setIndex((value) => value + 1)
  }

  function dismissResume() {
    setShowResume(false)
  }

  function choose(value: number) {
    dismissResume()
    const next = { ...answers, [question.id]: value }
    setAnswers(next)
    saveAnswers(next)
    window.clearTimeout(advanceTimer.current)
    advanceTimer.current = window.setTimeout(() => goForward(next), ADVANCE_MS)
  }

  function goNext() {
    if (currentValue == null) return
    dismissResume()
    goForward(answers)
  }

  function goBack() {
    dismissResume()
    window.clearTimeout(advanceTimer.current)
    setIndex((value) => Math.max(0, value - 1))
  }

  function restart() {
    window.clearTimeout(advanceTimer.current)
    clearAnswers()
    setAnswers({})
    setIndex(0)
    setShowResume(false)
  }

  return (
    <>
      <Seo
        title="Jung Functions Quiz | Jungology"
        description="Forty-eight statements. Rate how true each one is, then see a type reading. A free Jung Functions Quiz from Jungology."
        path="/quiz"
      />

      <section className="section quiz">
        <div className="wrap narrow">
          <ProgressBar
            value={answeredCount}
            max={QUESTIONS.length}
            label={`Question ${index + 1} of ${QUESTIONS.length}`}
          />
          {showResume ? (
            <p className="quiz-resume">
              You left off here. Continue, or{' '}
              <button type="button" className="text-button" onClick={restart}>
                start over
              </button>
              .
            </p>
          ) : null}

          <article className="quiz-card">
            <h1 className="quiz-card__prompt">{question.text}</h1>
            <LikertScale name={question.id} value={currentValue} onChange={choose} />
          </article>

          <div className="quiz-nav">
            <Button variant="ghost" onClick={goBack} disabled={index === 0}>
              Back
            </Button>
            {currentValue != null ? (
              <Button onClick={goNext}>{isLast ? 'See results' : 'Next'}</Button>
            ) : (
              <span className="quiz-nav__hint">Tap a number to continue</span>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
