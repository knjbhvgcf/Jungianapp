import { Link } from 'react-router-dom'
import { QUIZ_PATH } from '../lib/quizPath'
import { Seo } from '../components/Seo'

export const LEGAL_TITLE = 'Notes on buying | Jung Functions Quiz'
export const LEGAL_DESCRIPTION =
  'What Jungology sells, how unlock keys work, refunds, and that quiz answers stay in your browser.'

export function Legal() {
  return (
    <>
      <Seo title={LEGAL_TITLE} description={LEGAL_DESCRIPTION} path="/legal" />
      <article className="section">
        <div className="wrap prose">
          <p className="eyebrow">jungology</p>
          <h1 className="serif-title">Notes on buying</h1>
          <p className="mono-stat">Jungology App · answers stay here</p>
          <p className="lede">
            The Jung Functions Quiz, the eight scores, and the choice of lead and support stay
            free. Jungology App is optional: seven days free, then $14 / month, cancel anytime.
            Your Type in Depth is paused on the public site for now. Existing keys still open
            the reading in this browser.
          </p>

          <h2>What you are buying</h2>
          <p>
            Jungology App is an email account for people, journal hours, and the type you keep.
            The rooms open after the trial starts, and they close when the Stripe period ends.
            Earlier Type in Depth purchases were a one-time
            Beebe reading of the stack you scored. It is an educational text, not psychotherapy,
            not a diagnosis, and not the MBTI® instrument.
          </p>

          <h2>Keys</h2>
          <p>
            If you already have a Stripe key, that key still unlocks the reading in this browser.
            Keep the email receipt.
          </p>

          <h2>Refunds</h2>
          <p>
            Type in Depth purchases were one-time digital readings. If that checkout failed or
            the key did not unlock, write from the email on the Stripe receipt. Jungology App
            bills monthly after the trial; cancel on Stripe and nothing later is charged. Stripe
            handles the card; Jungology does not store card numbers.
          </p>

          <h2>Privacy</h2>
          <p>
            Quiz answers stay in this browser until you start over. They are not sent to a server.
            After a finished quiz, the site may record which type was suggested and which stack
            you left on the results page, as counts only, so the quiz can be checked against
            published population shares. Jungology App is optional: a sign-in link by email can
            keep type, people, and journal for that address. Cloudflare and Google Analytics may
            count page views — which pages you open, not your answers or scores. Unlock keys stay
            in this browser so you do not have to paste them every time.
          </p>

          <p>
            <Link to="/about">About the quiz</Link>
            {' · '}
            <Link to={QUIZ_PATH}>Begin the quiz</Link>
          </p>
        </div>
      </article>
    </>
  )
}
