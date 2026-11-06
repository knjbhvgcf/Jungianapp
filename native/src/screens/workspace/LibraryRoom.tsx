import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native'
import {
  alreadyInLibrary,
  groupedFigures,
  matchFigures,
  type FigureKind,
  type PublicFigure,
} from '../../../../src/data/figures'
import { PERSONALITY_TYPES, typeByCode } from '../../../../src/data/personalityTypes'
import { FIGURES, groupTitle, groupsOf, isFigure, personGroupId } from '../../../../src/lib/workspace/circle'
import { readInviteSnapshot } from '../../../../src/lib/workspace/inviteClient'
import { newInviteToken } from '../../../../src/lib/workspace/invitePacket'
import { snapshotFromShare } from '../../../../src/lib/workspace/sharePacket'
import type { WorkspaceHouse, WorkspacePerson } from '../../../../src/lib/workspace/types'
import { armInvitePing, askToPingThisDevice, pingForPerson } from '../../../../src/lib/workspace/inviteWatch'
import { EightSeats } from '../../components/EightSeats'
import { OptionSheet } from '../../components/OptionSheet'
import { SproutPortrait } from '../../components/SproutPortrait'
import { addPerson, applyPersonSnapshot, loadHouse, removePerson, updatePerson } from '../../house'
import { shareInviteHref } from '../../invite'
import { colors } from '../../theme'
import { ui } from '../../ui'
import { MapRoom } from './MapRoom'

type PeopleView = 'list' | 'add' | 'figures' | 'person' | 'map'

export function LibraryRoom({
  house,
  onCompare,
  onMe,
}: {
  house: WorkspaceHouse
  onCompare: (personId: string) => void
  onMe?: () => void
}) {
  const [view, setView] = useState<PeopleView>('list')
  const [whoId, setWhoId] = useState<string | null>(null)
  const people = house.people
  const who = people.find((person) => person.id === whoId) ?? null

  const namedGroups = groupsOf(house)

  if (view === 'add') {
    return (
      <AddPerson
        groups={namedGroups}
        onBack={() => setView('list')}
        onCreated={(id) => {
          setWhoId(id)
          setView('person')
        }}
      />
    )
  }

  if (view === 'map') {
    return (
      <MapRoom
        house={house}
        onBack={() => setView('list')}
        onOpenPerson={(id) => {
          setWhoId(id)
          setView('person')
        }}
        onOpenMe={() => onMe?.()}
        onAdd={() => setView('add')}
      />
    )
  }

  if (view === 'figures') {
    return (
      <AddFigure
        people={people}
        onBack={() => setView('list')}
        onCreated={(id) => {
          setWhoId(id)
          setView('person')
        }}
      />
    )
  }

  if (view === 'person' && who) {
    return (
      <PersonFile
        person={who}
        groups={namedGroups}
        onBack={() => setView('list')}
        onRemoved={() => {
          setWhoId(null)
          setView('list')
        }}
        onCompare={() => onCompare(who.id)}
      />
    )
  }

  const friends = people.filter((person) => !isFigure(person))
  const figures = people.filter(isFigure)

  return (
    <ScrollView contentContainerStyle={ui.screen}>
      <Text style={ui.eyebrow}>Library</Text>
      <Text style={ui.title}>People</Text>
      <Text style={ui.lede}>People you keep a chart of, and public figures you have named.</Text>
      {friends.length ? (
        friends.map((person) => (
          <PersonRow
            key={person.id}
            person={person}
            ping={Boolean(pingForPerson(house, person.id))}
            onPress={() => {
              setWhoId(person.id)
              setView('person')
            }}
          />
        ))
      ) : (
        <Text style={ui.note}>No one yet.</Text>
      )}
      {figures.length ? (
        <>
          <Text style={styles.section}>Public figures</Text>
          {figures.map((person) => (
            <PersonRow
              key={person.id}
              person={person}
              onPress={() => {
                setWhoId(person.id)
                setView('person')
              }}
            />
          ))}
        </>
      ) : null}
      <Pressable accessibilityRole="button" onPress={() => setView('add')} style={ui.cta}>
        <Text style={ui.ctaText}>Add someone</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => setView('figures')} style={[ui.ghost, styles.gap]}>
        <Text style={ui.ghostText}>Add a public figure</Text>
      </Pressable>
      {friends.length ? (
        <Pressable accessibilityRole="button" onPress={() => setView('map')} style={[ui.ghost, styles.gap]}>
          <Text style={ui.ghostText}>Maps</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  )
}

function PersonRow({
  person,
  ping,
  onPress,
}: {
  person: WorkspacePerson
  ping?: boolean
  onPress: () => void
}) {
  const type = person.code ? typeByCode(person.code) : undefined
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.person, ping ? styles.personPing : null]}>
      {type ? <SproutPortrait code={type.code} size={56} /> : <View style={styles.empty} />}
      <View style={styles.copy}>
        <Text style={styles.name}>{person.name}</Text>
        <Text style={styles.meta}>
          {person.relation}
          {ping ? ` · sent ${person.code}` : person.code ? ` · ${person.code}` : ' · waiting on quiz'}
        </Text>
      </View>
    </Pressable>
  )
}

function AddPerson({
  groups,
  onBack,
  onCreated,
}: {
  groups: { id: string; name: string }[]
  onBack: () => void
  onCreated: (id: string) => void
}) {
  const [name, setName] = useState('')
  const [relation, setRelation] = useState('')
  const [code, setCode] = useState('')
  const [groupName, setGroupName] = useState('')
  const [picking, setPicking] = useState<'type' | 'group' | null>(null)

  async function submit() {
    const trimmed = name.trim()
    if (!trimmed) return
    const named = code ? typeByCode(code) : undefined
    const token = newInviteToken()
    const house = await addPerson({
      name: trimmed,
      relation: relation.trim() || 'Friend',
      source: named ? 'named' : 'invite',
      code: named?.code,
      trigger: '',
      comfort: '',
      inviteToken: token,
      circle: groupName.trim() || undefined,
    })
    if (!named) armInvitePing(token, trimmed, house.email)
    const created = house.people[house.people.length - 1]
    if (created) onCreated(created.id)
  }

  return (
    <ScrollView contentContainerStyle={ui.screen}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
        <Text style={ui.ghostText}>Back</Text>
      </Pressable>
      <Text style={ui.title}>Add</Text>
      <View style={ui.field}>
        <Text style={ui.label}>Name</Text>
        <TextInput value={name} onChangeText={setName} style={ui.input} placeholderTextColor={colors.faint} />
      </View>
      <View style={ui.field}>
        <Text style={ui.label}>Who they are to you</Text>
        <TextInput
          value={relation}
          onChangeText={setRelation}
          placeholder="Partner, mother, friend"
          placeholderTextColor={colors.faint}
          style={ui.input}
        />
      </View>
      <View style={ui.field}>
        <Text style={ui.label}>Their type, if you know it</Text>
        <Pressable accessibilityRole="button" onPress={() => setPicking('type')} style={ui.ghost}>
          <Text style={ui.ghostText}>{code ? code : "I don't know yet"}</Text>
        </Pressable>
      </View>
      <View style={ui.field}>
        <Text style={ui.label}>Group</Text>
        <TextInput
          value={groupName}
          onChangeText={setGroupName}
          placeholder="Family, work, band"
          placeholderTextColor={colors.faint}
          style={ui.input}
        />
      </View>
      {groups.length ? (
        <Pressable accessibilityRole="button" onPress={() => setPicking('group')} style={[ui.ghost, styles.gap]}>
          <Text style={ui.ghostText}>Choose an existing group</Text>
        </Pressable>
      ) : null}
      <Pressable accessibilityRole="button" onPress={() => void submit()} style={ui.cta}>
        <Text style={ui.ctaText}>Add</Text>
      </Pressable>
      <OptionSheet
        visible={picking === 'type'}
        title="Type"
        value={code}
        groups={[
          {
            label: 'Types',
            items: [
              { value: '', label: "I don't know yet" },
              ...PERSONALITY_TYPES.map((type) => ({
                value: type.code,
                label: `${type.code} · ${type.title}`,
              })),
            ],
          },
        ]}
        onPick={setCode}
        onClose={() => setPicking(null)}
      />
      <OptionSheet
        visible={picking === 'group'}
        title="Group"
        value={groupName}
        groups={[
          {
            label: 'Groups',
            items: groups.map((group) => ({ value: group.name, label: group.name })),
          },
        ]}
        onPick={setGroupName}
        onClose={() => setPicking(null)}
      />
    </ScrollView>
  )
}

function AddFigure({
  people,
  onBack,
  onCreated,
}: {
  people: WorkspacePerson[]
  onBack: () => void
  onCreated: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Partial<Record<FigureKind, boolean>>>({})
  const listed = matchFigures(query)
  const searching = Boolean(query.trim())

  async function keep(figure: PublicFigure) {
    const existing = people.find(
      (person) => person.name.trim().toLowerCase() === figure.name.trim().toLowerCase(),
    )
    if (existing) {
      onCreated(existing.id)
      return
    }
    const named = typeByCode(figure.code)
    if (!named) return
    const house = await addPerson({
      name: figure.name,
      relation: figure.role,
      source: 'named',
      code: named.code,
      trigger: '',
      comfort: '',
      circle: 'figures',
    })
    const created = house.people[house.people.length - 1]
    if (created) onCreated(created.id)
  }

  return (
    <ScrollView contentContainerStyle={ui.screen} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
        <Text style={ui.ghostText}>Back</Text>
      </Pressable>
      <Text style={ui.title}>Public figures</Text>
      <Text style={ui.lede}>People, fiction, and anime. Named types. Not a quiz.</Text>
      <View style={ui.field}>
        <Text style={ui.label}>Search</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Name, story, anime, or type"
          placeholderTextColor={colors.faint}
          style={ui.input}
        />
      </View>
      {listed.length ? (
        groupedFigures(listed).map((group) => {
          const shown = searching || Boolean(open[group.kind])
          return (
            <View key={group.kind}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: shown }}
                onPress={() => {
                  if (searching) return
                  setOpen((current) => ({ ...current, [group.kind]: !current[group.kind] }))
                }}
                style={styles.sectionHit}
              >
                <Text style={styles.section}>
                  {group.label} · {group.items.length}
                </Text>
                <Text style={styles.sectionMark}>{shown ? '−' : '+'}</Text>
              </Pressable>
              {shown
                ? group.items.map((figure) => {
                    const kept = alreadyInLibrary(people, figure)
                    return (
                      <Pressable
                        key={figure.name}
                        accessibilityRole="button"
                        onPress={() => void keep(figure)}
                        style={styles.person}
                      >
                        <SproutPortrait code={figure.code} size={56} />
                        <View style={styles.copy}>
                          <Text style={styles.name}>{figure.name}</Text>
                          <Text style={styles.meta}>
                            {figure.role} · {figure.code}
                            {kept ? ' · in library' : ''}
                          </Text>
                        </View>
                      </Pressable>
                    )
                  })
                : null}
            </View>
          )
        })
      ) : (
        <Text style={ui.note}>No one by that name.</Text>
      )}
    </ScrollView>
  )
}

function PersonFile({
  person,
  groups,
  onBack,
  onRemoved,
  onCompare,
}: {
  person: WorkspacePerson
  groups: { id: string; name: string }[]
  onBack: () => void
  onRemoved: () => void
  onCompare: () => void
}) {
  const [seat, setSeat] = useState<number | null>(null)
  const [edit, setEdit] = useState(false)
  const [paste, setPaste] = useState('')
  const [pasteError, setPasteError] = useState('')
  const [editName, setEditName] = useState(person.name)
  const [editRelation, setEditRelation] = useState(person.relation)
  const [editCode, setEditCode] = useState(person.code ?? '')
  const [editCircle, setEditCircle] = useState(
    isFigure(person) ? 'Public figures' : groupTitle(personGroupId(person), groups),
  )
  const [picking, setPicking] = useState<'type' | 'group' | null>(null)
  const [lookNote, setLookNote] = useState('')
  const [lookBusy, setLookBusy] = useState(false)
  const them = person.code ? typeByCode(person.code) : undefined
  const figure = isFigure(person)
  const inviteHref = !figure && person.inviteToken ? shareInviteHref(person.inviteToken) : ''

  useEffect(() => {
    setEdit(false)
    setSeat(null)
    setPaste('')
    setPasteError('')
    setLookNote('')
  }, [person.id])

  useEffect(() => {
    setEditName(person.name)
    setEditRelation(person.relation)
    setEditCode(person.code ?? '')
    setEditCircle(isFigure(person) ? 'Public figures' : groupTitle(personGroupId(person), groups))
  }, [person.id, person.name, person.relation, person.code, person.circle])

  useEffect(() => {
    if (figure || person.inviteToken) return
    void updatePerson(person.id, { inviteToken: newInviteToken() })
  }, [figure, person.id, person.inviteToken])

  useEffect(() => {
    if (figure || !person.inviteToken || person.code) return
    let cancelled = false
    void readInviteSnapshot(person.inviteToken).then((result) => {
      if (cancelled || !result.ok || !result.snapshot) return
      void applyPersonSnapshot(person.id, result.snapshot)
    })
    return () => {
      cancelled = true
    }
  }, [figure, person.id, person.inviteToken, person.code])

  async function saveEdit() {
    const trimmed = editName.trim()
    if (!trimmed) return
    const named = editCode ? typeByCode(editCode) : undefined
    await updatePerson(person.id, {
      name: trimmed,
      relation: editRelation.trim() || 'Friend',
      source: named ? 'named' : 'invite',
      code: named?.code,
      percents: person.percents,
      circle: /^public figures$/i.test(editCircle.trim()) ? FIGURES : editCircle.trim() || undefined,
    })
    setEdit(false)
  }

  async function keepPaste() {
    const snapshot = snapshotFromShare(paste)
    if (!snapshot) {
      setPasteError('Need a type and the eight percentages. Not the answers.')
      return
    }
    await applyPersonSnapshot(person.id, snapshot)
    setPaste('')
    setPasteError('')
    setSeat(null)
  }

  return (
    <ScrollView contentContainerStyle={ui.screen}>
      <View style={styles.head}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backHit}>
          <Text style={ui.ghostText}>Back</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setEdit((value) => !value)} style={styles.backHit}>
          <Text style={ui.ghostText}>{edit ? 'Close' : 'Edit'}</Text>
        </Pressable>
      </View>
      <Text style={ui.title}>{person.name}</Text>
      <Text style={ui.stat}>
        {person.relation}
        {person.code ? ` · ${person.code}` : ''}
        {them ? ` · ${them.title}` : ''}
      </Text>
      {them ? (
        <View style={styles.portrait}>
          <SproutPortrait code={them.code} size={140} />
        </View>
      ) : null}

      {edit ? (
        <View>
          <View style={ui.field}>
            <Text style={ui.label}>Name</Text>
            <TextInput value={editName} onChangeText={setEditName} style={ui.input} placeholderTextColor={colors.faint} />
          </View>
          <View style={ui.field}>
            <Text style={ui.label}>Who they are to you</Text>
            <TextInput
              value={editRelation}
              onChangeText={setEditRelation}
              style={ui.input}
              placeholderTextColor={colors.faint}
            />
          </View>
          <View style={ui.field}>
            <Text style={ui.label}>Their type</Text>
            <Pressable accessibilityRole="button" onPress={() => setPicking('type')} style={ui.ghost}>
              <Text style={ui.ghostText}>{editCode || "I don't know yet"}</Text>
            </Pressable>
          </View>
          <View style={ui.field}>
            <Text style={ui.label}>Group</Text>
            <TextInput
              value={editCircle}
              onChangeText={setEditCircle}
              placeholder="Family, work, band"
              placeholderTextColor={colors.faint}
              style={ui.input}
            />
          </View>
          <Pressable accessibilityRole="button" onPress={() => setPicking('group')} style={[ui.ghost, styles.gap]}>
            <Text style={ui.ghostText}>Choose a group</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => void saveEdit()} style={[ui.cta, styles.gap]}>
            <Text style={ui.ctaText}>Save</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              Alert.alert(`Remove ${person.name}?`, 'They leave the library on this phone.', [
                { text: 'Keep', style: 'cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: () => void removePerson(person.id).then(onRemoved),
                },
              ])
            }}
            style={[ui.ghost, styles.gap]}
          >
            <Text style={ui.ghostText}>Remove from library</Text>
          </Pressable>
        </View>
      ) : null}

      {them ? (
        <Pressable accessibilityRole="button" onPress={onCompare} style={[ui.cta, styles.gap]}>
          <Text style={ui.ctaText}>Compare</Text>
        </Pressable>
      ) : null}
      {figure ? <Text style={ui.lede}>Named type. Not a quiz.</Text> : null}
      {figure ? null : (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              askToPingThisDevice()
              void loadHouse().then((next) => armInvitePing(person.inviteToken, person.name, next.email))
              void Share.share({
                message: inviteHref
                  ? `Jungology quiz: ${inviteHref}`
                  : 'Jungology quiz: https://jungology.com/quiz',
              })
            }}
            style={[ui.ghost, styles.gap]}
          >
            <Text style={ui.ghostText}>Share quiz invite</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (!person.inviteToken) return
              setLookBusy(true)
              void readInviteSnapshot(person.inviteToken).then((result) => {
                setLookBusy(false)
                if (!result.ok) {
                  setLookNote(result.error)
                  return
                }
                if (!result.snapshot) {
                  setLookNote('Nothing yet. They finish the quiz and send from Results.')
                  return
                }
                void applyPersonSnapshot(person.id, result.snapshot).then(() => {
                  setLookNote(`Kept ${result.snapshot?.code}.`)
                })
              })
            }}
            style={[ui.ghost, styles.gap]}
          >
            <Text style={ui.ghostText}>{lookBusy ? 'Looking…' : 'Look for their result'}</Text>
          </Pressable>
          {lookNote ? <Text style={ui.note}>{lookNote}</Text> : null}
          <Text style={ui.lede}>
            Send them the invite. They send type and eight percentages from Results. You can also paste a line here.
          </Text>
          <View style={ui.field}>
            <Text style={ui.label}>Paste their percentages</Text>
            <TextInput
              value={paste}
              onChangeText={(value) => {
                setPaste(value)
                setPasteError('')
              }}
              placeholder="jungology INFP Fi72 Ne64 …"
              placeholderTextColor={colors.faint}
              multiline
              style={[ui.input, ui.area]}
            />
          </View>
          {pasteError ? <Text style={ui.note}>{pasteError}</Text> : null}
          <Pressable accessibilityRole="button" onPress={() => void keepPaste()} style={[ui.cta, styles.gap]}>
            <Text style={ui.ctaText}>Keep these percentages</Text>
          </Pressable>
        </>
      )}
      {them ? (
        <EightSeats
          stack={them.stack}
          percents={person.percents}
          selected={seat}
          onSelect={(index) => setSeat((current) => (current === index ? null : index))}
          caption={`${person.name}'s eight seats. Tap a seat.`}
        />
      ) : (
        <Text style={ui.note}>Name their type with Edit, or paste percentages.</Text>
      )}
      <View style={ui.field}>
        <Text style={ui.label}>Notes</Text>
        <TextInput
          value={person.trigger}
          onChangeText={(value) => void updatePerson(person.id, { trigger: value })}
          placeholder="What you notice"
          placeholderTextColor={colors.faint}
          multiline
          style={[ui.input, ui.area]}
        />
      </View>
      <View style={ui.field}>
        <Text style={ui.label}>Remember</Text>
        <TextInput
          value={person.comfort}
          onChangeText={(value) => void updatePerson(person.id, { comfort: value })}
          placeholder="What you want to keep about them"
          placeholderTextColor={colors.faint}
          multiline
          style={[ui.input, ui.area]}
        />
      </View>
      <OptionSheet
        visible={picking === 'type'}
        title="Type"
        value={editCode}
        groups={[
          {
            label: 'Types',
            items: [
              { value: '', label: "I don't know yet" },
              ...PERSONALITY_TYPES.map((type) => ({
                value: type.code,
                label: `${type.code} · ${type.title}`,
              })),
            ],
          },
        ]}
        onPick={setEditCode}
        onClose={() => setPicking(null)}
      />
      <OptionSheet
        visible={picking === 'group'}
        title="Group"
        value={editCircle}
        groups={[
          {
            label: 'Groups',
            items: [
              ...groups.map((group) => ({ value: group.name, label: group.name })),
              { value: 'Public figures', label: 'Public figures' },
            ],
          },
        ]}
        onPick={setEditCircle}
        onClose={() => setPicking(null)}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  personPing: {
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 16,
    paddingHorizontal: 8,
  },
  empty: {
    width: 56,
    height: 67,
    borderWidth: 2,
    borderColor: colors.dim,
    borderRadius: 12,
  },
  copy: {
    flex: 1,
  },
  name: {
    color: colors.ink,
    fontSize: 18,
  },
  meta: {
    marginTop: 2,
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 13,
  },
  sectionHit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginTop: 10,
  },
  section: {
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionMark: {
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 16,
  },
  back: {
    alignSelf: 'flex-start',
    minHeight: 40,
    justifyContent: 'center',
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backHit: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  portrait: {
    alignItems: 'center',
    marginVertical: 8,
  },
  gap: {
    marginBottom: 12,
  },
})
