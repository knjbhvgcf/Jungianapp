import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { ProgressBar } from '../components/ProgressBar'
import { Seo } from '../components/Seo'
import { followUpQuestions, needsFollowUp, pairsNeedingFollowUp } from '../lib/clarify'
import { isQuizComplete } from '../lib/scoring'
import { loadAnswers, loadClarifyAnswers, saveClarifyAnswers } from '../lib/storage'

const ADVANCE_MS = 160

export function Clarify() {
  const navigate = useNavigate()
  const advanceTimer = useRef<number>(0)
  const quizAnswers = useMemo(() => loadAnswers(), [])
  const questions = useMemo(() => followUpQuestions(quizAnswers), [quizAnswers])
  const pairs = useMemo(() => pairsNeedingFollowUp(quizAnswers), [quizAnswers])
  const [answers, setAnswers] = useState(() => loadClarifyAnswers())
  const [index, setIndex] = useState(() => {
    const stored = loadClarifyAnswers()
    const firstUnanswered = questions.findIndex((item) => stored[item.id] == null)
    return firstUnanswered === -1 ? 0 : firstUnanswered
  })

  useEffect(() => {
    return () => window.clearTimeout(advanceTimer.current)
  }, [])

  if (!isQuizComplete(quizAnswers)) {
    return <Navigate to="/quiz" replace />
  }

  if (!questions.length) {
    return <Navigate to="/results" replace />
  }

  const question = questions[index]
  if (!question) return null

  const currentValue = answers[question.id]
  const isLast = index === questions.length - 1
  const firstOption = index % 2 === 0 ? 'a' : 'b'
  const options =
    firstOption === 'a'
      ? [
          { id: question.a, text: question.aText },
          { id: question.b, text: question.bText },
        ]
      : [
          { id: question.b, text: question.bText },
          { id: question.a, text: question.aText },
        ]

  function goForward(nextAnswers: typeof answers) {
    if (nextAnswers[question.id] == null) return
    window.clearTimeout(advanceTimer.current)
    if (isLast) {
      if (needsFollowUp(quizAnswers, nextAnswers)) return
      navigate('/results')
      return
    }
    setIndex((value) => value + 1)
  }

  function updateAnswer(value: typeof question.a | typeof question.b) {
    const next = { ...answers, [question.id]: value }
    setAnswers(next)
    saveClarifyAnswers(next)
    window.clearTimeout(advanceTimer.current)
    advanceTimer.current = window.setTimeout(() => goForward(next), ADVANCE_MS)
  }

  function goNext() {
    if (currentValue == null) return
    goForward(answers)
  }

  function goBack() {
    window.clearTimeout(advanceTimer.current)
    setIndex((value) => Math.max(0, value - 1))
  }

  const pairWords =
    pairs.length === 1
      ? pairs[0]?.label ?? 'two answers'
      : pairs.map((pair) => pair.label).join(', ')

  return (
    <>
      <Seo
        title="A few more questions | Jung Functions"
        description="A short follow-up when two answers were too close."
        path="/clarify"
      />

      <section className="section quiz">
        <div className="wrap narrow">
          <ProgressBar
            value={questions.filter((item) => answers[item.id] != null).length}
            max={questions.length}
            label={`Question ${index + 1} of ${questions.length}`}
          />

          <p className="note">
            {pairs.length === 1
              ? `Two answers were too close to name a type yet. Pick the sentence that sounds more like you.`
              : `${pairWords} were close. Pick the sentence that sounds more like you.`}
          </p>

          <article className="quiz-card">
            <h1 className="quiz-card__prompt">{question.prompt}</h1>
            <fieldset className="clarify-choices">
              <legend className="sr-only">Which is more you?</legend>
              {options.map((option) => (
                <label
                  key={option.id}
                  className={currentValue === option.id ? 'clarify-choice is-selected' : 'clarify-choice'}
                >
                  <input
                    type="radio"
                    name={question.id}
                    checked={currentValue === option.id}
                    onChange={() => updateAnswer(option.id)}
                  />
                  <span>{option.text}</span>
                </label>
              ))}
            </fieldset>
          </article>

          <div className="quiz-nav">
            <Button variant="ghost" onClick={goBack} disabled={index === 0}>
              Back
            </Button>
            {currentValue != null ? (
              <Button onClick={goNext}>{isLast ? 'See results' : 'Next'}</Button>
            ) : (
              <span className="quiz-nav__hint">Tap a sentence to continue</span>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
