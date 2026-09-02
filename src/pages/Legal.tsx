import { Link } from 'react-router-dom'
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
            free. Two optional readings can be unlocked after Stripe checkout.
          </p>

          <h2>What you are buying</h2>
          <p>
            Your Type in Depth is a longer Beebe reading of the stack you just scored. Compatibility
            is a separate reading of how the other fifteen types sit on that stack. They are
            educational texts, not psychotherapy, not a diagnosis, and not the MBTI® instrument.
          </p>

          <h2>Keys</h2>
          <p>
            After payment, Stripe should return you to this site with a key in the link. That key
            unlocks the product in this browser. Keep the email receipt. A Type in Depth key will
            not open compatibility, and the other way around.
          </p>

          <h2>Refunds</h2>
          <p>
            These are one-time digital readings. If checkout failed or the key did not unlock,
            write from the email on the Stripe receipt and the charge can be refunded. Stripe
            handles the card; Jungology does not store card numbers.
          </p>

          <h2>Privacy</h2>
          <p>
            There is no account. Quiz answers stay in this browser session until you close the tab
            or start over. They are not sent to a server. Cloudflare and Google Analytics may count
            page views — which pages you open, not your answers, scores, or type. Unlock state is
            stored in this browser so you do not have to paste the key every time.
          </p>

          <p>
            <Link to="/about">About the quiz</Link>
            {' · '}
            <Link to="/quiz">Begin the quiz</Link>
          </p>
        </div>
      </article>
    </>
  )
}
