import type { FunctionId } from '../data/functions'

type SketchProps = {
  kind?: FunctionId | 'seeker'
  className?: string
}

export function Sketch({ kind = 'seeker', className = '' }: SketchProps) {
  return (
    <svg className={`sketch ${className}`} viewBox="0 0 220 260" role="img" aria-hidden="true">
      {kind === 'Ni' ? <Ni /> : null}
      {kind === 'Ne' ? <Ne /> : null}
      {kind === 'Si' ? <Si /> : null}
      {kind === 'Se' ? <Se /> : null}
      {kind === 'Ti' ? <Ti /> : null}
      {kind === 'Te' ? <Te /> : null}
      {kind === 'Fi' ? <Fi /> : null}
      {kind === 'Fe' ? <Fe /> : null}
      {kind === 'seeker' ? <Se /> : null}
    </svg>
  )
}

function Head({ cx = 110, cy = 58 }: { cx?: number; cy?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="22" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <circle cx={cx - 7} cy={cy - 1} r="2.1" fill="currentColor" />
      <circle cx={cx + 7} cy={cy - 1} r="2.1" fill="currentColor" />
      <path
        d="M102 66c3 4 8 6 16 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        transform={`translate(${cx - 110} ${cy - 58})`}
      />
    </g>
  )
}

function Se() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
      <path d="M86 86c8-18 40-18 48 0 6 14-2 28-10 34l-8 72H104l-8-72c-8-6-16-20-10-34Z" fill="currentColor" />
      <circle cx="110" cy="58" r="22" />
      <circle cx="103" cy="57" r="2.1" fill="currentColor" stroke="none" />
      <circle cx="117" cy="57" r="2.1" fill="currentColor" stroke="none" />
      <path d="M102 66c3 4 8 6 16 0" strokeWidth="1.8" />
      <path d="M86 188h48l6 42H80l6-42Z" fill="currentColor" />
      <path d="M68 118h24" />
      <path d="M128 118h18l22-38 8 4-24 42H128Z" />
      <path d="M148 92h28v8h-10v34h-8V100h-10V92Z" fill="currentColor" stroke="none" />
      <circle cx="176" cy="78" r="10" />
      <path d="M48 168h28v34H48z" />
      <path d="M52 174h20M52 182h20M52 190h12" strokeWidth="1.6" />
    </g>
  )
}

function Ni() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
      <Head />
      <path d="M78 92c12-8 52-8 64 0v96H78V92Z" fill="currentColor" />
      <path d="M90 188h40l8 42H82l8-42Z" />
      <path d="M70 128h20M130 128h28" />
      <path d="M110 18l4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10Z" fill="currentColor" stroke="none" />
      <path d="M154 42l3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z" fill="currentColor" stroke="none" />
    </g>
  )
}

function Ne() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
      <Head />
      <path d="M84 90c10-6 42-6 52 0l10 98H74l10-98Z" />
      <path d="M92 188h36l10 42H82l10-42Z" fill="currentColor" />
      <path d="M110 92v-22M96 78 84 58M124 78l16-18" />
      <path d="M78 36l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill="currentColor" stroke="none" />
      <path d="M148 32l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill="currentColor" stroke="none" />
      <path d="M168 70l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill="currentColor" stroke="none" />
    </g>
  )
}

function Si() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
      <Head />
      <path d="M80 94h60v94H80z" fill="currentColor" />
      <path d="M92 188h36l8 42H84l8-42Z" />
      <path d="M148 108v70l18 8V116l-18-8Z" />
      <path d="M148 116h18M148 128h18" strokeWidth="1.5" />
      <path d="M70 140h18" />
    </g>
  )
}

function Ti() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
      <Head />
      <path d="M86 90h48v70l-8 28H94l-8-28V90Z" />
      <circle cx="110" cy="128" r="16" />
      <path d="M110 112v32M94 128h32" strokeWidth="1.6" />
      <path d="M92 188h36l8 42H84l8-42Z" fill="currentColor" />
      <path d="M70 118h16M134 118h18" />
    </g>
  )
}

function Te() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
      <Head />
      <path d="M82 92h56l8 96H74l8-96Z" fill="currentColor" />
      <path d="M90 188h40l8 42H82l8-42Z" />
      <path d="M138 120h34" />
      <path d="M158 108v24" />
      <path d="M68 132h18" />
      <rect x="156" y="96" width="28" height="18" rx="3" />
    </g>
  )
}

function Fi() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
      <Head />
      <path d="M88 92c20-14 44 4 44 24 0 36-22 54-22 72H88c0-18-16-36-16-72 0-20 16-28 16-24Z" fill="currentColor" />
      <path d="M92 188h36l8 42H84l8-42Z" />
      <path d="M110 118c8 10 0 22-8 18" stroke="#fff" strokeWidth="1.8" />
      <path d="M68 140h16M136 132h18" />
    </g>
  )
}

function Fe() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
      <Head />
      <path d="M78 94h64v94H78z" />
      <path d="M90 188h40l8 42H82l8-42Z" fill="currentColor" />
      <path d="M62 128c-10 18 4 40 22 40" />
      <path d="M158 128c10 18-4 40-22 40" />
      <path d="M96 130h28" strokeWidth="1.6" />
    </g>
  )
}
