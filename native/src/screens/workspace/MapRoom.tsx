import { useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { BEEBE_ROLES, beebeStack } from '../../../../src/data/beebe'
import { FUNCTIONS, type FunctionId } from '../../../../src/data/functions'
import { typeByCode } from '../../../../src/data/personalityTypes'
import { groupTitle, groupsOf, personGroupId } from '../../../../src/lib/workspace/circle'
import type { ResultSnapshot, WorkspaceHouse, WorkspacePerson } from '../../../../src/lib/workspace/types'
import { renameGroup } from '../../house'
import { colors } from '../../theme'
import { ui } from '../../ui'

const SHORT: Record<string, string> = {
  hero: 'Hero',
  parent: 'Parent',
  child: 'Child',
  anima: 'Inferior',
  opposing: 'Opposing',
  senex: 'Critic',
  trickster: 'Trickster',
  demon: 'Demon',
}

const GROUPS: { title: string; ids: FunctionId[] }[] = [
  { title: 'Perceiving', ids: ['Ni', 'Ne', 'Si', 'Se'] },
  { title: 'Judging', ids: ['Ti', 'Te', 'Fi', 'Fe'] },
]

function roleAt(self: ResultSnapshot | null, id: FunctionId) {
  if (!self) return null
  const index = beebeStack(self.stack).indexOf(id)
  if (index < 0) return null
  const role = BEEBE_ROLES[index]
  return { key: role.key, label: SHORT[role.key] ?? role.label }
}

function tieLine(self: ResultSnapshot, person: WorkspacePerson) {
  const type = person.code ? typeByCode(person.code) : undefined
  if (!type) return null
  if (type.code === self.code) return `${person.name} is the same stack.`
  const role = roleAt(self, type.stack[0])
  if (!role) return `${person.name} leads with ${type.stack[0]}.`
  return `${person.name} leads with ${type.stack[0]}, your ${role.label}.`
}

export function MapRoom({
  house,
  onBack,
  onOpenPerson,
  onOpenMe,
  onAdd,
}: {
  house: WorkspaceHouse
  onBack: () => void
  onOpenPerson: (id: string) => void
  onOpenMe: () => void
  onAdd: () => void
}) {
  const listed = groupsOf(house)
  const [circle, setCircle] = useState(listed[0]?.id ?? '')
  const title = groupTitle(circle, listed)
  const [draft, setDraft] = useState(title)
  const focused = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const self = house.self
  const people = house.people
  const members = people.filter((person) => personGroupId(person) === circle && person.code)
  const waiting = people.filter((person) => personGroupId(person) === circle && !person.code)

  useEffect(() => {
    if (!focused.current) setDraft(title)
  }, [title])

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  function commit(raw: string) {
    const next = raw.trim()
    if (!next || !circle || next === title) {
      if (!focused.current) setDraft(title)
      return
    }
    void renameGroup(circle, next)
  }

  function onName(text: string) {
    setDraft(text)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => commit(text), 350)
  }

  const listedKey = listed.map((group) => group.id).join(',')

  useEffect(() => {
    if (!listed.length) return
    if (!listed.some((group) => group.id === circle)) setCircle(listed[0].id)
  }, [circle, listed, listedKey])

  return (
    <ScrollView contentContainerStyle={ui.screen} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
        <Text style={ui.ghostText}>Back</Text>
      </Pressable>
      <Text style={ui.eyebrow}>Maps</Text>
      <Text style={ui.title}>{title || 'Maps'}</Text>
      <Text style={ui.lede}>
        {title ? `Who leads with what in ${title}. Not a ranking.` : 'Name a group, then add people to it.'}
      </Text>
      {listed.length ? (
        <View style={styles.pills}>
          {listed.map((group) => (
            <Pressable
              key={group.id}
              accessibilityRole="button"
              onPress={() => setCircle(group.id)}
              style={[styles.pill, circle === group.id ? styles.pillOn : null]}
            >
              <Text style={circle === group.id ? styles.pillOnText : ui.ghostText}>{group.name}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {circle ? (
        <View style={ui.field}>
          <Text style={ui.label}>Group name</Text>
          <TextInput
            value={draft}
            onChangeText={onName}
            onFocus={() => {
              focused.current = true
            }}
            onBlur={() => {
              focused.current = false
              if (timer.current) clearTimeout(timer.current)
              commit(draft)
            }}
            onSubmitEditing={(event) => commit(event.nativeEvent.text)}
            placeholder="Family, work, band"
            style={ui.input}
            placeholderTextColor={colors.faint}
          />
          {draft.trim() && draft.trim() !== title ? (
            <Pressable accessibilityRole="button" onPress={() => commit(draft)} style={[ui.ghost, styles.keep]}>
              <Text style={ui.ghostText}>Keep {draft.trim()}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {self && circle
        ? GROUPS.map((group) => (
            <View key={group.title} style={styles.block}>
              <Text style={styles.ring}>{group.title}</Text>
              {group.ids.map((id) => {
                const role = roleAt(self, id)
                const here = [
                  ...(self.stack[0] === id ? [{ id: 'me', name: 'You', code: self.code }] : []),
                  ...members
                    .map((person) => {
                      const type = person.code ? typeByCode(person.code) : undefined
                      if (!type || type.stack[0] !== id) return null
                      return { id: person.id, name: person.name, code: type.code }
                    })
                    .filter((item): item is { id: string; name: string; code: string } => Boolean(item)),
                ]
                return (
                  <View key={id} style={styles.room}>
                    <Text style={styles.fn}>{id}</Text>
                    <Text style={styles.role}>{role ? `your ${role.label}` : FUNCTIONS[id].name}</Text>
                    {here.length ? (
                      here.map((member) => (
                        <Pressable
                          key={member.id}
                          accessibilityRole="button"
                          onPress={() => (member.id === 'me' ? onOpenMe() : onOpenPerson(member.id))}
                          style={styles.chip}
                        >
                          <Text style={styles.chipText}>
                            {member.name} · {member.code}
                          </Text>
                        </Pressable>
                      ))
                    ) : (
                      <Text style={styles.empty}>empty</Text>
                    )}
                  </View>
                )
              })}
            </View>
          ))
        : null}
      {!self ? <Text style={ui.note}>Name a type on Me first. The map follows that stack.</Text> : null}
      {self
        ? people
            .filter((person) => personGroupId(person) === circle)
            .map((person) => {
              const line = tieLine(self, person)
              return line ? (
                <Pressable key={person.id} accessibilityRole="button" onPress={() => onOpenPerson(person.id)}>
                  <Text style={ui.note}>{line}</Text>
                </Pressable>
              ) : null
            })
        : null}
      {waiting.length ? (
        <Text style={ui.note}>
          {waiting.map((person) => person.name).join(', ')} {waiting.length === 1 ? 'has' : 'have'} no type yet.
        </Text>
      ) : null}
      <Pressable accessibilityRole="button" onPress={onAdd} style={[ui.cta, styles.gap]}>
        <Text style={ui.ctaText}>Add someone</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  back: {
    alignSelf: 'flex-start',
    minHeight: 40,
    justifyContent: 'center',
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  pill: {
    flexGrow: 0,
    alignSelf: 'flex-start',
    minHeight: 40,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 999,
  },
  pillOn: {
    backgroundColor: colors.ink,
  },
  pillOnText: {
    color: colors.bg,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  block: {
    marginBottom: 16,
  },
  ring: {
    marginBottom: 8,
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  room: {
    marginBottom: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 16,
  },
  fn: {
    color: colors.ink,
    fontSize: 18,
    fontStyle: 'italic',
  },
  role: {
    marginBottom: 8,
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 12,
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 999,
  },
  chipText: {
    color: colors.ink,
    fontSize: 13,
  },
  empty: {
    color: colors.faint,
    fontSize: 13,
  },
  gap: {
    marginTop: 12,
  },
  keep: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
})
