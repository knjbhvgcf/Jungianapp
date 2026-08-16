export type FunctionId = 'Ni' | 'Ne' | 'Si' | 'Se' | 'Ti' | 'Te' | 'Fi' | 'Fe'

export type Attitude = 'introverted' | 'extraverted'
export type Dichotomy = 'intuition' | 'sensing' | 'thinking' | 'feeling'

export type CognitiveFunction = {
  id: FunctionId
  name: string
  attitude: Attitude
  dichotomy: Dichotomy
  role: string
  summary: string
  description: string
  color: string
}

export const FUNCTION_IDS: FunctionId[] = [
  'Ni',
  'Ne',
  'Si',
  'Se',
  'Ti',
  'Te',
  'Fi',
  'Fe',
]

export const FUNCTIONS: Record<FunctionId, CognitiveFunction> = {
  Ni: {
    id: 'Ni',
    name: 'Introverted Intuition',
    attitude: 'introverted',
    dichotomy: 'intuition',
    role: 'Inner vision',
    summary: 'Follows underlying patterns and a sense of where things are heading.',
    description:
      'In Psychological Types, introverted intuition is oriented by the inner object: unconscious images that disclose a direction or meaning. It compresses many impressions into a single vision of where things are tending, often before the outer facts are lined up.',
    color: '#8b7cc8',
  },
  Ne: {
    id: 'Ne',
    name: 'Extraverted Intuition',
    attitude: 'extraverted',
    dichotomy: 'intuition',
    role: 'Possibilities',
    summary: 'Explores alternatives, connections, and what could be true.',
    description:
      'Extraverted intuition, as Jung describes it, is oriented by the object: it scents what a situation could become. It reads latent possibilities in the outer world, links what is not yet related, and often loses interest once a possibility has been realized.',
    color: '#e0b34a',
  },
  Si: {
    id: 'Si',
    name: 'Introverted Sensing',
    attitude: 'introverted',
    dichotomy: 'sensing',
    role: 'Lived memory',
    summary: 'Compares the present with personal history, precedent, and bodily familiarity.',
    description:
      'Introverted sensation is oriented by the subjective factor in the object. What is perceived is not only the public property of the thing, but the impression it leaves in memory and body. Precedent, familiarity, and inner sensory texture guide judgment.',
    color: '#6f9a78',
  },
  Se: {
    id: 'Se',
    name: 'Extraverted Sensing',
    attitude: 'extraverted',
    dichotomy: 'sensing',
    role: 'Present reality',
    summary: 'Tracks what is happening now through direct sensory contact and action.',
    description:
      'Extraverted sensation is oriented by the object as it is. Jung ties it to concrete actuality: texture, timing, impact, and the aesthetic of the given moment. It trusts what can be seen, touched, and done now more than a theory about it.',
    color: '#d36a3a',
  },
  Ti: {
    id: 'Ti',
    name: 'Introverted Thinking',
    attitude: 'introverted',
    dichotomy: 'thinking',
    role: 'Inner logic',
    summary: 'Builds precise mental models and checks them for consistency.',
    description:
      'Introverted thinking is oriented by the subjective idea. Jung’s account is that it seeks inner consistency: the model must be true, even if it is not yet useful. It refines definitions and notices when a collective formula is logically hollow.',
    color: '#5b8ab8',
  },
  Te: {
    id: 'Te',
    name: 'Extraverted Thinking',
    attitude: 'extraverted',
    dichotomy: 'thinking',
    role: 'External order',
    summary: 'Organizes people, plans, and metrics so that results actually happen.',
    description:
      'Extraverted thinking is oriented by the object and by objective data. It follows facts others can check, collective standards, and what can be arranged in the shared world. Jung notes that it wants a conclusion that works, not only an elegant inner theory.',
    color: '#3d8a82',
  },
  Fi: {
    id: 'Fi',
    name: 'Introverted Feeling',
    attitude: 'introverted',
    dichotomy: 'feeling',
    role: 'Personal values',
    summary: 'Checks choices against an inner sense of authenticity and rightness.',
    description:
      'Introverted feeling is oriented by the subjective factor. Values are intense and often hard to display. Jung describes a loyalty to inner images of worth that may look like indifference from outside, while remaining unmoved by merely collective taste.',
    color: '#c46b8a',
  },
  Fe: {
    id: 'Fe',
    name: 'Extraverted Feeling',
    attitude: 'extraverted',
    dichotomy: 'feeling',
    role: 'Shared atmosphere',
    summary: 'Reads the group mood and works toward harmony, inclusion, and morale.',
    description:
      'Extraverted feeling is oriented by the object: the feeling-tone of people, custom, and what “one” does. Jung ties it to adapting value to the situation so that relation remains possible. A logically neat choice can still feel unfinished if it injures the group.',
    color: '#d4a05c',
  },
}

export const FUNCTION_LIST = FUNCTION_IDS.map((id) => FUNCTIONS[id])
