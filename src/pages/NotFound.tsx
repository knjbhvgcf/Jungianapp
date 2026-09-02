import { Button } from '../components/Button'
import { Seo } from '../components/Seo'

export function NotFound() {
  return (
    <>
      <Seo
        title="Page not found | Jung Functions Quiz"
        description="That page does not exist. Return home or take the quiz."
        path="/404"
      />
      <section className="section">
          <div className="wrap screen empty-state">
            <h1 className="serif-title">Lost</h1>
            <p className="mono-stat">page not found</p>
            <p>That URL is not part of this quiz, so head home or start the test.</p>
          <div className="hero__actions">
            <Button to="/">Home</Button>
            <Button to="/quiz" variant="ghost">
              Take the quiz
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
