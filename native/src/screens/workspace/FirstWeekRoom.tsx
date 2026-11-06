import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native'
import { PERSONALITY_TYPES, typeByCode } from '../../../../src/data/personalityTypes'
import { groupsOf } from '../../../../src/lib/workspace/circle'
import { firstWeekPerson } from '../../../../src/lib/workspace/firstWeek'
import { readInviteSnapshot } from '../../../../src/lib/workspace/inviteClient'
import { armInvitePing, askToPingThisDevice } from '../../../../src/lib/workspace/inviteWatch'
import { snapshotFromShare } from '../../../../src/lib/workspace/sharePacket'
import type { WorkspaceHouse } from '../../../../src/lib/workspace/types'
import { OptionSheet } from '../../components/OptionSheet'
import { addFirstWeekPerson, keepInviteArrival } from '../../house'
import { shareInviteHref } from '../../invite'
import { colors } from '../../theme'
import { ui } from '../../ui'

export function FirstWeekRoom({
  house,
  onSkip,
  onCompare,
}: {
  house: WorkspaceHouse
  onSkip: () => void
  onCompare: (personId: string) => void
}) {
  const person = firstWeekPerson(house)
  const [name, setName] = useState('')
  const [relation, setRelation] = useState('')
  const [code, setCode] = useState('')
  const [groupName, setGroupName] = useState('')
  const [picking, setPicking] = useState<'type' | 'group' | null>(null)
  const [paste, setPaste] = useState('')
  const [pasteError, setPasteError] = useState('')
  const [lookNote, setLookNote] = useState('')
  const [lookBusy, setLookBusy] = useState(false)

  const inviteHref = person?.inviteToken ? shareInviteHref(person.inviteToken) : ''

  useEffect(() => {
    setPaste('')
    setPasteError('')
    setLookNote('')
  }, [person?.id])

  useEffect(() => {
    if (!person?.inviteToken || person.code) return
    let cancelled = false
    async function look() {
      const result = await readInviteSnapshot(person!.inviteToken ?? '')
      if (cancelled || !result.ok || !result.snapshot) return
      await keepInviteArrival(person!.id, result.snapshot)
    }
    void look()
    const timer = setInterval(() => void look(), 4000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [person?.id, person?.inviteToken, person?.code])

  async function submit() {
    const trimmed = name.trim()
    if (!trimmed) return
    const named = code ? typeByCode(code) : undefined
    const house = await addFirstWeekPerson({
      name: trimmed,
      relation: relation.trim() || 'Friend',
      source: named ? 'named' : 'invite',
      code: named?.code,
      trigger: '',
      comfort: '',
      circle: groupName.trim() || undefined,
    })
    const created = house.people[house.people.length - 1]
    if (created && !named) armInvitePing(created.inviteToken, created.name, house.email)
  }

  async function look() {
    if (!person?.inviteToken) return
    setLookBusy(true)
    const result = await readInviteSnapshot(person.inviteToken)
    setLookBusy(false)
    if (!result.ok) {
      setLookNote(result.error)
      return
    }
    if (!result.snapshot) {
      setLookNote('Nothing yet. They finish the quiz and send from Results.')
      return
    }
    await keepInviteArrival(person.id, result.snapshot)
    setLookNote(`Kept ${result.snapshot.code}.`)
  }

  async function keepPaste() {
    if (!person) return
    const snapshot = snapshotFromShare(paste)
    if (!snapshot) {
      setPasteError('Need a type and the eight percentages. Not the answers.')
      return
    }
    await keepInviteArrival(person.id, snapshot)
    setPaste('')
    setPasteError('')
  }

  return (
    <ScrollView contentContainerStyle={ui.screen} keyboardShouldPersistTaps="handled">
      <Text style={ui.eyebrow}>This week</Text>
      <Text style={ui.title}>One person you know</Text>
      {!person ? (
        <>
          <Text style={ui.lede}>
            Partner, parent, friend. Not Einstein. Not Luffy. Public figures wait in Library.
          </Text>
          <View style={ui.field}>
            <Text style={ui.label}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={ui.input}
              placeholderTextColor={colors.faint}
            />
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
          {groupsOf(house).length ? (
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
                items: groupsOf(house).map((group) => ({ value: group.name, label: group.name })),
              },
            ]}
            onPick={setGroupName}
            onClose={() => setPicking(null)}
          />
        </>
      ) : person.code ? (
        <>
          <Text style={ui.lede}>{person.name} is in. See you two side by side.</Text>
          <Text style={ui.stat}>
            {person.relation}
            {person.code ? ` · ${person.code}` : ''}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => onCompare(person.id)} style={ui.cta}>
            <Text style={ui.ctaText}>Compare</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={ui.lede}>
            Send {person.name} the quiz. They send type and eight percentages from Results.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              askToPingThisDevice()
              armInvitePing(person.inviteToken, person.name, house.email)
              void Share.share({
                message: inviteHref
                  ? `Jungology quiz: ${inviteHref}`
                  : 'Jungology quiz: https://jungology.com/quiz',
              })
            }}
            style={ui.cta}
          >
            <Text style={ui.ctaText}>Share quiz invite</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void look()}
            style={[ui.ghost, styles.gap]}
          >
            <Text style={ui.ghostText}>{lookBusy ? 'Looking…' : 'Look for their result'}</Text>
          </Pressable>
          {lookNote ? <Text style={ui.note}>{lookNote}</Text> : null}
          <View style={ui.field}>
            <Text style={ui.label}>Paste their percentages</Text>
            <TextInput
              value={paste}
              onChangeText={(value) => {
                setPaste(value)
                setPasteError('')
              }}
              multiline
              style={[ui.input, ui.area]}
              placeholder="jungology INFP Fi72 Ne64 …"
              placeholderTextColor={colors.faint}
            />
          </View>
          {pasteError ? <Text style={ui.note}>{pasteError}</Text> : null}
          <Pressable accessibilityRole="button" onPress={() => void keepPaste()} style={ui.ghost}>
            <Text style={ui.ghostText}>Keep</Text>
          </Pressable>
        </>
      )}
      <Pressable accessibilityRole="button" onPress={onSkip} style={[ui.ghost, styles.gap]}>
        <Text style={ui.ghostText}>Skip for now</Text>
      </Pressable>
      <Text style={ui.note}>
        They stay in Library if you already added them. Come back when you want.
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  gap: {
    marginTop: 12,
  },
})
