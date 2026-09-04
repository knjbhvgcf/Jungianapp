import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import pagesSeed from '../content/pages.json'
import typesSeed from '../content/types.json'
import guidesSeed from '../content/guides.json'
import type { Guide } from '../content/guideTypes'
import type { PagesContent, TypeContent } from '../content/schema'
import type { ArchetypePage } from '../data/archetypePages'
import type { PersonalityType } from '../data/personalityTypes'
import type { TypeMapCopy } from '../data/typeMaps'
import {
  checkCmsPassword,
  clearCmsPassword,
  fetchCmsStatus,
  getCmsPassword,
  saveCmsFile,
  setCmsPassword,
  type CmsStatus,
} from './cms'
import { siteCopy } from './copy'

const EDITING_KEY = 'jung-cms.editing'
const PREVIEW_KEY = 'jung-cms.previewType'

function clone<T>(value: T): T {
  return structuredClone(value)
}

function readEditingFlag() {
  return sessionStorage.getItem(EDITING_KEY) === '1' && Boolean(getCmsPassword())
}

function readPreviewType() {
  return sessionStorage.getItem(PREVIEW_KEY) || 'INTJ'
}

export function asPersonality(type: TypeContent): PersonalityType {
  return {
    code: type.code,
    title: type.title,
    name: type.name,
    stack: type.stack,
    summary: type.summary,
    image: type.image,
  }
}

export function chaptersFrom(type: TypeContent): TypeMapCopy {
  return {
    myth: type.myth,
    tension: type.tension,
    inTheDay: type.inTheDay,
    atWork: type.atWork,
    withOthers: type.withOthers,
    auxiliaryHealing: type.auxiliaryHealing,
    antiTypeStress: type.antiTypeStress,
    famous: type.famous,
    growth: type.growth,
    shadowWork: type.shadowWork,
    prompts: type.prompts,
  }
}

export function archetypeFrom(type: TypeContent): ArchetypePage {
  return {
    mythic: type.mythic,
    tagline: type.tagline,
    dominantName: type.dominantName,
    auxiliaryName: type.auxiliaryName,
    bridge: type.bridge,
    pattern: type.pattern,
    image: type.patternNote,
    roles: type.roles ?? [],
  }
}

type EditModeContextValue = {
  editing: boolean
  dirty: boolean
  busy: boolean
  message: string
  status: CmsStatus | null
  pages: PagesContent
  types: TypeContent[]
  guides: Guide[]
  previewType: string
  setPreviewType: (code: string) => void
  tryUnlock: (password: string) => Promise<void>
  exit: () => boolean
  save: () => Promise<void>
  patchPages: (updater: (pages: PagesContent) => PagesContent) => void
  patchType: (code: string, updater: (type: TypeContent) => TypeContent) => void
  patchGuide: (slug: string, updater: (guide: Guide) => Guide) => void
}

const EditModeContext = createContext<EditModeContextValue | null>(null)

export function EditModeProvider({ children }: { children: ReactNode }) {
  const [editing, setEditing] = useState(readEditingFlag)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<CmsStatus | null>(null)
  const [pages, setPages] = useState<PagesContent>(() => clone(pagesSeed as PagesContent))
  const [types, setTypes] = useState<TypeContent[]>(() => clone(typesSeed as TypeContent[]))
  const [guides, setGuides] = useState<Guide[]>(() => clone(guidesSeed as Guide[]))
  const [previewType, setPreviewTypeState] = useState(readPreviewType)

  useEffect(() => {
    void fetchCmsStatus().then(setStatus)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('is-editing', editing)
    return () => document.body.classList.remove('is-editing')
  }, [editing])

  useEffect(() => {
    if (!dirty) return
    function onLeave(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onLeave)
    return () => window.removeEventListener('beforeunload', onLeave)
  }, [dirty])

  const setPreviewType = useCallback((code: string) => {
    const next = code.toUpperCase()
    sessionStorage.setItem(PREVIEW_KEY, next)
    setPreviewTypeState(next)
  }, [])

  const markDirty = useCallback(() => {
    setDirty(true)
    setMessage('')
  }, [])

  const tryUnlock = useCallback(async (password: string) => {
    await checkCmsPassword(password)
    setCmsPassword(password)
    sessionStorage.setItem(EDITING_KEY, '1')
    setPages(clone(pagesSeed as PagesContent))
    setTypes(clone(typesSeed as TypeContent[]))
    setGuides(clone(guidesSeed as Guide[]))
    setDirty(false)
    setMessage('')
    setEditing(true)
  }, [])

  const exit = useCallback(() => {
    if (dirty && !window.confirm('Leave without saving the wording you changed?')) {
      return false
    }
    sessionStorage.removeItem(EDITING_KEY)
    setEditing(false)
    setDirty(false)
    setMessage('')
    setPages(clone(pagesSeed as PagesContent))
    setTypes(clone(typesSeed as TypeContent[]))
    setGuides(clone(guidesSeed as Guide[]))
    return true
  }, [dirty])

  const save = useCallback(async () => {
    setBusy(true)
    setMessage('')
    try {
      const password = getCmsPassword()
      await saveCmsFile('pages', pages, password)
      await saveCmsFile('types', types, password)
      await saveCmsFile('guides', guides, password)
      setDirty(false)
      setMessage('Saved on this computer. jungology.com updates after a git push.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }, [pages, types, guides])

  const patchPages = useCallback((updater: (current: PagesContent) => PagesContent) => {
    setPages((current) => updater(current))
    markDirty()
  }, [markDirty])

  const patchType = useCallback(
    (code: string, updater: (type: TypeContent) => TypeContent) => {
      const needle = code.toUpperCase()
      setTypes((current) =>
        current.map((type) => (type.code === needle ? updater(type) : type)),
      )
      markDirty()
    },
    [markDirty],
  )

  const patchGuide = useCallback(
    (slug: string, updater: (guide: Guide) => Guide) => {
      setGuides((current) =>
        current.map((guide) => (guide.slug === slug ? updater(guide) : guide)),
      )
      markDirty()
    },
    [markDirty],
  )

  const value = useMemo<EditModeContextValue>(
    () => ({
      editing,
      dirty,
      busy,
      message,
      status,
      pages,
      types,
      guides,
      previewType,
      setPreviewType,
      tryUnlock,
      exit,
      save,
      patchPages,
      patchType,
      patchGuide,
    }),
    [
      editing,
      dirty,
      busy,
      message,
      status,
      pages,
      types,
      guides,
      previewType,
      setPreviewType,
      tryUnlock,
      exit,
      save,
      patchPages,
      patchType,
      patchGuide,
    ],
  )

  return <EditModeContext.Provider value={value}>{children}</EditModeContext.Provider>
}

export function useEditMode() {
  const context = useContext(EditModeContext)
  if (!context) {
    throw new Error('useEditMode must be used inside EditModeProvider')
  }
  return context
}

export function useSiteCopy() {
  const { editing, pages } = useEditMode()
  return editing ? pages : siteCopy
}

export function useTypesDraft() {
  const { editing, types } = useEditMode()
  return editing ? types : (typesSeed as TypeContent[])
}

export function useGuidesDraft() {
  const { editing, guides } = useEditMode()
  return editing ? guides : (guidesSeed as Guide[])
}

export function useTypeDraft(code: string) {
  const types = useTypesDraft()
  const needle = code.trim().toUpperCase()
  return types.find((type) => type.code === needle)
}

export function usePersonalityTypes() {
  const types = useTypesDraft()
  return types.map(asPersonality)
}

export function lockEditMode() {
  sessionStorage.removeItem(EDITING_KEY)
  clearCmsPassword()
}
