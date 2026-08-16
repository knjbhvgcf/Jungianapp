import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { LikertScale } from '../components/LikertScale'
import { ProgressBar } from '../components/ProgressBar'
import { Seo } from '../components/Seo'
import { isHeroPhaseQuestion, QUESTIONS } from '../data/questions'
import { needsFollowUp } from '../lib/clarify'
import { isQuizComplete, type Answers } from '../lib/scoring'
import { clearAnswers, loadAnswers, loadClarifyAnswers, markCompleted, saveAnswers } from '../lib/storage'

export function Quiz() {
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<Answers>(() => loadAnswers())
  const [index, setIndex] = useState(() => {
    const stored = loadAnswers()
    const firstUnanswered = QUESTIONS.findIndex((item) => stored[item.id] == null)
    return firstUnanswered === -1 ? 0 : firstUnanswered
  })

  const answeredCount = useMemo(
    () => QUESTIONS.filter((item) => answers[item.id] != null).length,
    [answers],
  )
  const question = QUESTIONS[index]
  if (!question) return null

  const currentValue = answers[question.id]
  const isLast = index === QUESTIONS.length - 1
  const canContinue = currentValue != null
  const heroPhase = isHeroPhaseQuestion(question)
  const leavingHeroPhase =
    heroPhase && (isLast || !isHeroPhaseQuestion(QUESTIONS[index + 1] ?? question))
  const heroGate = leavingHeroPhase && needsFollowUp(answers, loadClarifyAnswers())

  function updateAnswer(value: number) {
    const next = { ...answers, [question.id]: value }
    setAnswers(next)
    saveAnswers(next)
  }

  function goNext() {
    if (!canContinue) return
    if (heroGate) {
      navigate('/clarify')
      return
    }
    if (isLast) {
      if (!isQuizComplete(answers)) return
      markCompleted()
      navigate(needsFollowUp(answers, loadClarifyAnswers()) ? '/clarify' : '/results')
      return
    }
    setIndex((value) => value + 1)
  }

  function goBack() {
    setIndex((value) => Math.max(0, value - 1))
  }

  function restart() {
    clearAnswers()
    setAnswers({})
    setIndex(0)
  }

  return (
    <>
      <Seo
        title="Cognitive Functions Quiz | Jung Functions"
        description="Forty-eight statements drawn from Psychological Types, first to find the leading function, then to fill in the rest of the type."
        path="/quiz"
      />

      <section className="section quiz">
        <div className="wrap narrow">
          <ProgressBar
            value={answeredCount}
            max={QUESTIONS.length}
            label={
              heroPhase
                ? `Leading function · ${index + 1} of ${QUESTIONS.length}`
                : `The rest of the type · ${index + 1} of ${QUESTIONS.length}`
            }
          />

          <article className="quiz-card">
            <p className="eyebrow">
              {heroPhase ? 'leading function' : 'the rest of the type'} · statement{' '}
              {String(index + 1).padStart(2, '0')}
            </p>
            <h1 className="quiz-card__prompt">{question.text}</h1>
            <LikertScale name={question.id} value={currentValue} onChange={updateAnswer} />
          </article>

          <div className="quiz-nav">
            <Button variant="ghost" onClick={goBack} disabled={index === 0}>
              Back
            </Button>
            <Button onClick={goNext} disabled={!canContinue}>
              {heroGate
                ? 'Name the leading function'
                : isLast
                  ? needsFollowUp(answers, loadClarifyAnswers())
                    ? 'A few more questions'
                    : 'See results'
                  : 'Next'}
            </Button>
          </div>

          <p className="quiz-reset">
            <button type="button" className="text-button" onClick={restart}>
              Start over
            </button>
          </p>
        </div>
      </section>
    </>
  )
}
