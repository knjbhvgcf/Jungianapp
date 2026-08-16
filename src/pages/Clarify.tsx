import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { ProgressBar } from '../components/ProgressBar'
import { Seo } from '../components/Seo'
import { FUNCTIONS } from '../data/functions'
import { isHeroPhaseComplete } from '../data/questions'
import { followUpQuestions, needsFollowUp, pairsNeedingFollowUp } from '../lib/clarify'
import { isQuizComplete } from '../lib/scoring'
import { loadAnswers, loadClarifyAnswers, saveClarifyAnswers } from '../lib/storage'

export function Clarify() {
  const navigate = useNavigate()
  const quizAnswers = useMemo(() => loadAnswers(), [])
  const questions = useMemo(() => followUpQuestions(quizAnswers), [quizAnswers])
  const pairs = useMemo(() => pairsNeedingFollowUp(quizAnswers), [quizAnswers])
  const [answers, setAnswers] = useState(() => loadClarifyAnswers())
  const [index, setIndex] = useState(() => {
    const stored = loadClarifyAnswers()
    const firstUnanswered = questions.findIndex((item) => stored[item.id] == null)
    return firstUnanswered === -1 ? 0 : firstUnanswered
  })

  const quizDone = isQuizComplete(quizAnswers)

  if (!isHeroPhaseComplete(quizAnswers)) {
    return <Navigate to="/quiz" replace />
  }

  if (!questions.length) {
    return <Navigate to={quizDone ? '/results' : '/quiz'} replace />
  }

  const question = questions[index]
  if (!question) return null

  const currentValue = answers[question.id]
  const isLast = index === questions.length - 1
  const canContinue = currentValue != null
  const pairLabel = `${question.a} / ${question.b}`
  const pairNames = `${FUNCTIONS[question.a].name} or ${FUNCTIONS[question.b].name}`
  const firstOption = index % 2 === 0 ? 'a' : 'b'
  const options = firstOption === 'a'
    ? [
        { id: question.a, text: question.aText },
        { id: question.b, text: question.bText },
      ]
    : [
        { id: question.b, text: question.bText },
        { id: question.a, text: question.aText },
      ]

  function updateAnswer(value: typeof question.a | typeof question.b) {
    const next = { ...answers, [question.id]: value }
    setAnswers(next)
    saveClarifyAnswers(next)
  }

  function goNext() {
    if (!canContinue) return
    if (isLast) {
      if (needsFollowUp(quizAnswers, answers)) return
      navigate(isQuizComplete(quizAnswers) ? '/results' : '/quiz')
      return
    }
    setIndex((value) => value + 1)
  }

  function goBack() {
    setIndex((value) => Math.max(0, value - 1))
  }

  return (
    <>
      <Seo
        title="Close scores | Jung Functions"
        description="A few more questions when two function-attitudes scored too close to name a lead."
        path="/clarify"
      />

      <section className="section quiz">
        <div className="wrap narrow">
          <ProgressBar
            value={questions.filter((item) => answers[item.id] != null).length}
            max={questions.length}
            label={`Follow-up ${index + 1} of ${questions.length}`}
          />

          <p className="note">
            {pairs.length === 1
              ? `${pairLabel} scored too close to name a lead from the first items alone, so these questions ask which sounds more like you — ${pairNames}.`
              : `${pairs.map((pair) => `${pair.a} / ${pair.b}`).join(', ')} scored close, and each pair needs a decision. Now: ${pairLabel}.`}
          </p>

          <article className="quiz-card">
            <p className="eyebrow">{question.label} · choose one</p>
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
            <Button onClick={goNext} disabled={!canContinue}>
              {isLast ? (quizDone ? 'See results' : 'Continue the quiz') : 'Next'}
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
