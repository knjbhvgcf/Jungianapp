import type { FunctionId } from './functions'
import { TYPE_MAPS } from './typeMaps'

export type ChapterCopy = {
  voice: string
  work: string
  watch: string
  practice: string
  relating: string
}

export const ROLE_CHAPTER: Record<
  string,
  { work: string; watch: string; practice: string; relating: string }
> = {
  hero: {
    work: 'This is the function you trust first, the manner in which you take up a problem when you are at your best and the face by which you prefer to be known, until, over years, it ceases to be merely a skill and becomes identity itself: not only what you do well, but what you silently take a competent person to be, so that the remaining functions are either recruited to serve it or dismissed as noise.',
    watch: 'When the Hero / Heroine inflates, the other functions are treated as stupid or slow, and fatigue, contempt, and the resolve to “do it oneself” become the ordinary weather of the day; you may also grow brittle about being seen as this function, so that a joke at its expense lands not as humour but as an attack upon the self.',
    practice: 'Name, this week, one task that the Hero / Heroine ought not to run, and either hand it to the Parent or allow it to remain unfinished, for competence that can share the stage is a sturdier thing than competence that must occupy it entirely, as if the rest of the psyche were a delay.',
    relating: 'People meet your Hero / Heroine as though it were your real self, and they will praise it, compete with it, or hide from it accordingly; it is worth noticing whom you secretly rank as serious according to whether they speak this function’s language, and whom you quietly set aside because they do not.',
  },
  parent: {
    work: 'This is how you foster, advise, and take responsibility, the supporting process that steadies the Hero / Heroine and is often what other people receive from you as care: the extra hour, the clarifying question, the standard you hold so that they need not, which, used well, is stewardship, and used automatically is a post you never applied for and cannot quite resign.',
    watch: 'When the Parent is tired it lectures, help hardens into control, and you may feel unseen if no one takes the advice you did not strictly offer; you can also parent those who did not ask, and then resent them for remaining children, as though their unfinishedness were a personal slight.',
    practice: 'Ask, before the Parent function begins its work, whether what is wanted is help, company, or to be left alone, and once in a week receive care in this same function from someone else without improving it, for the Parent that cannot be parented becomes a law unto itself.',
    relating: 'Partners and colleagues often feel looked after, or managed, which are neighbouring experiences and not the same, and those who lead with this function can feel like peers, while those who lead with its opposite may feel like critics you did not invite into the house.',
  },
  child: {
    work: 'This is play, relief, and improvisation, younger than the Hero / Heroine, charming, creative, and not fully accountable, a rest and not a government, and in love and friendship it is often the unguarded spark people fall for, precisely because it has not yet learned to govern itself and therefore has not yet learned to lie with professional skill.',
    watch: 'Inflation here looks like stubborn innocence, grand plans without follow-through, or a need for others to parent you, and under shame the Eternal Child hides while the Trickster, which is its shadow, begins to tie knots that will later be called accidents.',
    practice: 'Give the Eternal Child a bounded playground — an hour, a sketch, a game with an end — and do not put it in charge of rent, surgery, or other people’s feelings, nor starve it either, for a starved Eternal Child does not disappear but becomes a saboteur of the very order that refused it a room.',
    relating: 'People who lead with this function can delight you and yet not be taken seriously, and it is worth watching the urge either to baby them or to dump the adult work upon them because they “seem fine,” as though youth of function were youth of soul.',
  },
  anima: {
    work: 'The Inferior (Anima / Animus) is the door to the unconscious, at once aspirational and embarrassing, and you often meet it first in other people as longing, irritation, or idealization; Jung’s anima and animus are not costumes one puts on for effect, but the living other within, of which the Inferior is one of the usual faces, half desired and half feared.',
    watch: 'In stress it can grip, which is to say a sudden, crude, all-or-nothing use of this function, followed by shame, and you may hunt for a person who will carry it for you and then punish them for being merely human at a task you have not yet consented to learn; slow and small practice is the work here, for heroics usually backfire and inflate what they meant to conquer.',
    practice: 'Give this function ten minutes, not a personality transplant, and use it in a setting where failure is cheap; after a grip episode, write what happened in the body before you write the story of who is to blame, for the inferior speaks first in sensation and only afterwards in accusation.',
    relating: 'Types who lead with this function tend to magnetize you, and the pull is information rather than a verdict; the question worth asking is whether you are relating to them, or to the missing piece of yourself which they appear, for a season, to be.',
  },
  opposing: {
    work: 'This is the opposite attitude of the Hero / Heroine, which argues, blocks, and says “yes, but,” and which can also defend you when the Hero / Heroine’s way is being steamrolled — a necessary no, spoken in the same function turned the other way; Beebe’s Opposing Nemesis is often the inner adversary that sounds almost like you, and is therefore the harder to recognise as other.',
    watch: 'Chronic oppositional spin undermines your own stated aim, or picks fights in the Hero / Heroine’s language turned inside out, and you may call it honesty or rigor when it is only a refusal to be moved, a pride that would rather be unconvinced than changed.',
    practice: 'When you hear “yes, but,” ask which aim is being protected, for sometimes the Opposing Nemesis has a real objection and sometimes it is only pride, and it is the Parent, not the Hero / Heroine, that is fit to referee between them.',
    relating: 'People who lead with this function can feel like walking arguments, and the work is to notice the similarity: they are not your opposite so much as your Hero / Heroine facing the other way, which is why the quarrel has the peculiar heat of a family dispute.',
  },
  senex: {
    work: 'This is the shadow of the Parent, which limits, criticizes, and says no, and which, used well, is a necessary boundary, the freeze that stops a bad rescue, and used poorly is bitterness and the verdict that you should have known; the Critic is the Parent after it has given up on kindness and retained only the law.',
    watch: 'Harsh inner commentary gathers especially toward people who need the kind of help you usually give, and with it comes the withholding of expertise as punishment, or the enforcement of a standard you no longer believe in, as if consistency were holier than truth.',
    practice: 'When the Critic speaks, write its sentence, and then write the Parent’s version of the same concern, keeping the limit and dropping the scorn; if you cannot, step away before you parent from the Critic, for a boundary offered in contempt is not a boundary but a wound with a timetable.',
    relating: 'Those who lead with this function may feel cold, exacting, or as though they were grading you, and it is worth checking whether they are actually attacking, or whether you are hearing your own withheld Parent, which has been waiting for a face.',
  },
  trickster: {
    work: 'This is the shadow of the Eternal Child, which binds, jokes, and slips the knot, and which can get you out of impossible situations and into ones you cannot afterwards explain; mythically the Trickster is amoral rather than evil, hating to be trapped more than it loves to be good, and serving freedom even when freedom is a kind of cruelty.',
    watch: 'Double binds, mixed signals, and “I was only kidding” after a cut are its ordinary speech, and it appears most readily when you feel trapped by someone’s expectation, including your own; you may also trick yourself, inventing a loophole that costs more than the original demand would have cost in honesty.',
    practice: 'If you need an escape, name it as an escape, for a clean no is less violent than a bind, and if you have already tied a knot, untie it in daylight with one plain sentence rather than a second joke, which only tightens what it pretends to loosen.',
    relating: 'People who lead with this function can feel slippery or hilarious, and it is worth noticing when you invite them to be the escape hatch you will later resent, as though their gift for the side door were a character flaw you had not yourself commissioned.',
  },
  demon: {
    work: 'This is the most unconscious function, which undermines from below, and which, in later work, can become a daimon: a hard, truthful force that will not let the persona lie; you rarely “have” this function as a skill, but meet it as aftermath, as symptom, or as a value you had sworn was not yours and which nevertheless arrives with the authority of a god.',
    watch: 'You may notice it only after the fact — a wrecked relationship, a body symptom, a crusade, a freeze — and neither the attempt to weaponize it as a brand nor the pretence that it is not there will help, for both inflate what they mean to manage.',
    practice: 'After a blow-up or a collapse, ask what function this was in its crudest form, and then give that function a dignified and tiny use later in the week, on purpose and without an audience, for integration here is slow and will not be performed into being.',
    relating: 'Types who lead with this function can feel uncanny, too much, too blunt, or strangely like a missing Parent, and the projection is strong; reality-test before you marry the feeling or exile the person, for both marriage and exile, undertaken in that heat, are rituals of the Demon rather than of relation.',
  },
}

export const FUNCTION_VOICE: Record<
  FunctionId,
  {
    differentiated: string
    child: string
    inferior: string
    shadow: string
    withPeople: string
  }
> = {
  Ni: {
    differentiated:
      'Introverted intuition holds an inner picture of where a situation is tending, and as a leading or supporting process it compresses many impressions into one trajectory, waiting, often past the patience of others, for the image to clarify; it is not guessing so much as watching an inner object until the pattern discloses itself, so that other people may hear only the conclusion and never the long private incubation by which it was reached.',
    child:
      'As a younger function, introverted intuition can be dreamy and oracular, given to sudden convictions and symbolic hunches and a dislike of being asked for steps, for the vision is real enough while the timeline is not, and it would rather be believed than project-managed, as a child would rather be believed than scheduled.',
    inferior:
      'In the inferior position, introverted intuition often arrives as doom, mystique, or a vague sense that everything “means” something, and other people’s certainty about the future can fascinate or enrage you, while grip looks like conspiracy, fatal prophecy, or a sudden refusal to live in any future at all, as if time itself had become an insult.',
    shadow:
      'In the shadow, introverted intuition can become conspiracy, fatalism, or a private story that cannot be checked, arguing with facts by appeal to an unseen pattern, and it may also steal other people’s meaning and call the theft insight, which is a peculiarly quiet form of violence.',
    withPeople:
      'With others, introverted intuition is a bet on where they are going, which can feel like being truly seen, or like being written into a novel they did not agree to star in, and both experiences may be offered in the same week without the giver quite noticing the difference.',
  },
  Ne: {
    differentiated:
      'Extraverted intuition scents what could become of an object or situation, and as a leading process it opens the field, links what is not yet related, and keeps options alive until one ripens; it is loyal to the possible, which means it can look disloyal to yesterday’s plan, and its gift is the unused door, which it will not close merely because someone has grown tired of draughts.',
    child:
      'As a younger function, extraverted intuition is brainstorm and sparkle, many tabs and many maybe’s and a delight in the next idea, so that follow-through becomes someone else’s job unless the parent function steps in, and it charms rooms and then forgets what was promised in them, not always from malice but from a hunger that has already moved on.',
    inferior:
      'Inferior extraverted intuition can feel like chaos: too many futures, a panic at missing a possibility, or a sudden binge of new plans when the familiar world cracks, and other people’s open-endedness can look like irresponsibility until you are the one spinning, at which point the chaos reveals itself as your own unused door, forced.',
    shadow:
      'Shadow extraverted intuition scatters and undermines commitment, mocking a settled path as small or flooding you with alternatives exactly when a decision is needed, and it also gossip-branches, one implication becoming twelve, none of them checked, as if multiplicity were itself a proof.',
    withPeople:
      'With others, extraverted intuition multiplies what they could become, so that people feel expanded and then sometimes abandoned when the next spark arrives, which is a kindness and a desertion braided so tightly that neither party can easily name which strand they are holding.',
  },
  Si: {
    differentiated:
      'Introverted sensation stores the impression an object leaves in the body and memory, and as a leading process it compares the present with what has already been lived and asks whether this is as it should be; it is a craft of continuity — the known recipe, the kept promise, the inner sensory archive that tells you who you have been — and it will not be hurried into calling the new thing better merely because it is new.',
    child:
      'As a younger function, introverted sensation is comfort, nostalgia, and fussy detail, the right mug and the known route and a story told the same way, which soothes and does not govern, and which can also sulk when the familiar is moved without warning, as a child sulks when the furniture of home is rearranged in the night.',
    inferior:
      'Inferior introverted sensation may show as hypochondria, homesickness, or a sudden demand that the environment be exactly so, until the past feels more real than the room you are in, and grip often looks like a body emergency or a desperate return to an old version of home, which no longer exists in the form memory insists upon.',
    shadow:
      'Shadow introverted sensation rewrites history, nurses old injuries, or insists that this is how it has always been in order to block change, so that the inner archive becomes a courtroom, and it can also erase what does not fit the preferred memory, which is a quieter rewriting than a lie and no less complete.',
    withPeople:
      'With others, introverted sensation is loyalty to what you have already been through together, which is devotion, and sometimes a refusal to let them become someone new, as if the archive were a vow they had signed without reading.',
  },
  Se: {
    differentiated:
      'Extraverted sensation meets the object as it is — timing, texture, impact — and as a leading process it acts on what is here, reads the room through the senses, and trusts the concrete; it is not shallow but precise about the given, and theory waits, if it is wise, until the scene has actually been met, for the object has a right to be encountered before it is explained.',
    child:
      'As a younger function, extraverted sensation is appetite and thrill, food and style and sport and the next hit of now, which is fun until someone has to deal with the mess, and which also wants to be admired in the flesh, not only in principle, as if the body were the only honest witness.',
    inferior:
      'Inferior extraverted sensation can erupt as clumsiness, overindulgence, or a freeze in the face of too much stimulus, so that the present feels either dead or overwhelming, and grip may look like a binge, a crash, a sudden aesthetic overhaul, or a body that will not obey the plan, having been ignored until it could speak only in crisis.',
    shadow:
      'Shadow extraverted sensation becomes crude force, impulse, or contempt for anything that is not immediate, and it can also go numb — no body, no scene, no consequence — until people become objects to move or spectacles to consume, which is the object-world without the dignity of the object.',
    withPeople:
      'With others, extraverted sensation is presence, the simple fact of being here with this, now, which can feel like being chosen in the room, or like being only as real as the current lighting, and both may be true of the same evening.',
  },
  Ti: {
    differentiated:
      'Introverted thinking wants the idea itself to be consistent, and as a leading process it refines models, spots hollow formulas, and will delay action until the inner framework holds, preferring to be privately right rather than publicly finished; Jung’s introverted thinking serves the idea, not the committee, and will endure misunderstanding sooner than a conclusion that does not follow.',
    child:
      'As a younger function, introverted thinking is clever tinkering and the cry that something does not follow, loving a puzzle and disappearing into definitions while the group moves on, and wanting credit for the elegant catch rather than for the meeting notes, which it regards as a lesser literature.',
    inferior:
      'Inferior introverted thinking may appear as brittle logic, pedantry under stress, or a sudden collapse into not understanding anything, and other people’s clean frameworks can feel like a relief or a threat, while grip looks like a desperate, crude system that must explain the whole psyche by Thursday, as if time itself were a logical error.',
    shadow:
      'Shadow introverted thinking deconstructs in order to wound, dealing in gotchas, bad-faith distinctions, and a private logic that cannot be reached, so that understanding becomes a weapon, and it may also refuse to understand as a way of staying untouched, which is a fortress built of unanswered questions.',
    withPeople:
      'With others, introverted thinking is a request for precision, which some feel as respect and some as dissection, and it is worth calibrating whether you are clarifying the idea or withdrawing from the person, for the two operations can wear the same face.',
  },
  Te: {
    differentiated:
      'Extraverted thinking organizes the shared world by objective standards, and as a leading process it wants a conclusion others can check, a plan that works, and results that can be shown; it is not unfeeling by nature, but postpones feeling until the structure can hold, and Jung’s extraverted thinking is loyal to what can be arranged in common, which is a moral loyalty of a kind, though not always recognised as such.',
    child:
      'As a younger function, extraverted thinking is lists, hacks, and the urge to decide, enjoying efficiency in bursts and dropping the system once the game is no longer fun, and liking to be the one who made the plan happen this afternoon, which is a child’s pride in a grown instrument.',
    inferior:
      'Inferior extraverted thinking can look like clumsy management, harsh metrics, or a panic that nothing is under control, so that you over-rely on external authorities or despise them, and grip is often a tyrannical spreadsheet, a sudden firing of a person or a whole life, or helpless rage at incompetence, including your own, which the inferior cannot yet distinguish from the world’s.',
    shadow:
      'Shadow extraverted thinking tyrannizes, moving people like objects, worshipping a metric, or declaring a plan finished because saying so is easier than checking, and it can also collapse into impotent contempt for any outer order at all, as if the failure of one standard proved the impossibility of standards.',
    withPeople:
      'With others, extraverted thinking is a bid to make something actually happen together, which can feel like relief and leadership, or like being turned into a task, and the difference is whether the person remains visible inside the plan.',
  },
  Fi: {
    differentiated:
      'Introverted feeling orients by a private standard of worth, and as a leading process it knows what is right for the person before that rightness can be justified in public terms, and will not trade it for manners; intensity is often invisible, so that what looks like calm may be a full inner court in session, reaching a verdict no one else has been invited to hear.',
    child:
      'As a younger function, introverted feeling is sweet loyalty, aesthetic crush, and the insistence that one “just feels it,” sincere and not yet able to negotiate with the group, and it can also go sulky and absolute when a value is stepped on, as a child goes absolute when a beloved object is moved.',
    inferior:
      'Inferior introverted feeling may arrive as unexplained hurt, moral purity tests, or a sudden sense that this is not me, and you may envy people who seem to know what they love, while grip looks like a crusade, a collapse of worth, or an icy “fine” that is not fine, and which everyone in the room can hear except, for a moment, yourself.',
    shadow:
      'Shadow introverted feeling becomes silent resentment, self-excuse, or a private ethics that exempts you, so that values are used to cut others off rather than to live by, and it can also sentimentalize cruelty as authenticity, which is the counterfeit of the very standard it claims to serve.',
    withPeople:
      'With others, introverted feeling is a question of whether this is still true, so that people feel deeply chosen, or inexplicably dropped when they fail an inner test they were never shown, and both are forms of loyalty, one of them uninhabitable.',
  },
  Fe: {
    differentiated:
      'Extraverted feeling reads the feeling-tone of the people involved, and as a leading process it adjusts so that relation remains possible and takes the received values of the group seriously; it is a craft of climate — who is left out, what the room can bear, what would restore dignity — and a logically neat choice can still feel unfinished if it injures the we, which for this function is not a slogan but a fact of the object.',
    child:
      'As a younger function, extraverted feeling is niceness, performance, and the wish that everyone should have a good time, so that harmony is a game and conflict feels like the game ending, and it can also people-please as a way of staying in the photo, which is belonging purchased at the price of a self not yet admitted.',
    inferior:
      'Inferior extraverted feeling can flood as embarrassment, people-pleasing, or a sudden outburst aimed at the room, until collective mood feels either mandatory or fake, and grip may look like a public scene, a desperate bid to be liked, or a freeze in any group larger than one, as if the we had become a weather one could only drown in or deny.',
    shadow:
      'Shadow extraverted feeling manipulates atmosphere by guilt, charm, public shaming, or a smile that is a door closing, so that the group is used rather than related to, and it can also refuse all warmth as a way of staying in control, which is the climate inverted into a desert and still called weather.',
    withPeople:
      'With others, extraverted feeling is an offer of we, which can feel like belonging and being tended, or like being managed for the photo, and the difference is whether the we includes the truth of the persons or only their arrangement.',
  },
}

function voiceForRole(roleKey: string, functionId: FunctionId) {
  const voice = FUNCTION_VOICE[functionId]
  if (roleKey === 'hero' || roleKey === 'parent') return voice.differentiated
  if (roleKey === 'child') return voice.child
  if (roleKey === 'anima') return voice.inferior
  return voice.shadow
}

export function chapterBody(roleKey: string, functionId: FunctionId): ChapterCopy {
  const role = ROLE_CHAPTER[roleKey]
  const voice = voiceForRole(roleKey, functionId)
  const withPeople = FUNCTION_VOICE[functionId].withPeople
  if (!role) {
    return {
      voice,
      work: '',
      watch: '',
      practice: '',
      relating: withPeople,
    }
  }
  return {
    voice,
    work: role.work,
    watch: role.watch,
    practice: role.practice,
    relating: `${withPeople} ${role.relating}`,
  }
}

export function typeCopy(code: string) {
  return TYPE_MAPS[code]
}
