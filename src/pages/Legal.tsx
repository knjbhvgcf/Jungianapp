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
          <p className="mono-stat">one-time unlocks · answers stay here</p>
          <p className="lede">
            The Jung Functions Quiz, the eight scores, and the choice of lead and support stay
            free. Your Type in Depth can be unlocked after Stripe checkout.
          </p>

          <h2>What you are buying</h2>
          <p>
            Your Type in Depth is a longer Beebe reading of the stack you just scored. It is an
            educational text, not psychotherapy, not a diagnosis, and not the MBTI® instrument.
          </p>

          <h2>Keys</h2>
          <p>
            After payment, Stripe should return you to this site with a key in the link. That key
            unlocks the reading in this browser. Keep the email receipt.
          </p>

          <h2>Refunds</h2>
          <p>
            These are one-time digital readings. If checkout failed or the key did not unlock,
            write from the email on the Stripe receipt and the charge can be refunded. Stripe
            handles the card; Jungology does not store card numbers.
          </p>

          <h2>Privacy</h2>
          <p>
            There is no account. Quiz answers stay in this browser until you start over. They are
            not sent to a server. After a finished quiz, the site may record which type was
            suggested and which stack you left on the results page, as counts only, so the quiz
            can be checked against published population shares. Cloudflare and Google Analytics
            may count page views — which pages you open, not your answers or scores. Unlock state
            is stored in this browser so you do not have to paste the key every time.
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
