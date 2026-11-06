import { useCallback, useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { QUESTIONS } from '../src/data/questions'
import { needsFollowUp } from '../src/lib/clarify'
import type { Answers } from '../src/lib/scoring'
import { HomeScreen } from './src/screens/HomeScreen'
import { QuizScreen } from './src/screens/QuizScreen'
import { ClarifyScreen } from './src/screens/ClarifyScreen'
import { ResultsScreen } from './src/screens/ResultsScreen'
import { SproutsScreen } from './src/screens/SproutsScreen'
import { SproutScreen } from './src/screens/SproutScreen'
import { WorkspaceScreen } from './src/screens/WorkspaceScreen'
import { captureInviteFromLocation } from './src/invite'
import { loadAnswers, loadClarifyAnswers } from './src/storage'
import { colors } from './src/theme'

type Screen = 'home' | 'quiz' | 'clarify' | 'results' | 'sprouts' | 'sprout' | 'workspace'
type SproutFrom = 'home' | 'results' | 'workspace'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [inProgress, setInProgress] = useState(false)
  const [sproutCode, setSproutCode] = useState('INTJ')
  const [sproutFrom, setSproutFrom] = useState<SproutFrom>('home')
  const [sproutFromList, setSproutFromList] = useState(false)
  const goHome = useCallback(() => setScreen('home'), [])
  const goQuiz = useCallback(() => setScreen('quiz'), [])
  const goClarify = useCallback(() => setScreen('clarify'), [])
  const goResults = useCallback(() => setScreen('results'), [])
  const goWorkspace = useCallback(() => setScreen('workspace'), [])
  const goSprouts = useCallback((from: SproutFrom = 'home') => {
    setSproutFrom(from)
    setScreen('sprouts')
  }, [])
  const goSprout = useCallback((code: string, from?: SproutFrom) => {
    if (from) {
      setSproutFrom(from)
      setSproutFromList(false)
    } else {
      setSproutFromList(true)
    }
    setSproutCode(code)
    setScreen('sprout')
  }, [])

  const refreshProgress = useCallback(() => {
    void loadAnswers().then((answers) => {
      const count = QUESTIONS.filter((item) => answers[item.id] != null).length
      setInProgress(count > 0 && count < QUESTIONS.length)
    })
  }, [])

  useEffect(() => {
    refreshProgress()
  }, [refreshProgress, screen])

  useEffect(() => {
    void captureInviteFromLocation()
  }, [])

  async function finishQuiz(answers: Answers) {
    const clarify = await loadClarifyAnswers()
    setScreen(needsFollowUp(answers, clarify) ? 'clarify' : 'results')
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.shell}>
        <StatusBar style="light" />
        {screen === 'home' ? (
          <HomeScreen
            inProgress={inProgress}
            onBegin={goQuiz}
            onSprouts={() => goSprouts('home')}
            onSprout={(code) => goSprout(code, 'home')}
            onRooms={goWorkspace}
          />
        ) : null}
        {screen === 'quiz' ? (
          <QuizScreen onFinished={(answers) => void finishQuiz(answers)} onHome={goHome} />
        ) : null}
        {screen === 'clarify' ? <ClarifyScreen onFinished={goResults} onQuiz={goQuiz} /> : null}
        {screen === 'results' ? (
          <ResultsScreen
            onRestart={goHome}
            onClarify={goClarify}
            onQuiz={goQuiz}
            onSprout={(code) => goSprout(code, 'results')}
            onSprouts={() => goSprouts('results')}
            onRooms={goWorkspace}
          />
        ) : null}
        {screen === 'workspace' ? (
          <WorkspaceScreen
            onQuiz={goQuiz}
            onSprouts={() => goSprouts('workspace')}
            onSprout={(code) => goSprout(code, 'workspace')}
          />
        ) : null}
        {screen === 'sprouts' ? (
          <SproutsScreen
            onOpen={(code) => goSprout(code)}
            onBack={
              sproutFrom === 'results' ? goResults : sproutFrom === 'workspace' ? goWorkspace : goHome
            }
            onQuiz={goQuiz}
          />
        ) : null}
        {screen === 'sprout' ? (
          <SproutScreen
            code={sproutCode}
            onBack={() => {
              if (sproutFromList) setScreen('sprouts')
              else if (sproutFrom === 'results') goResults()
              else if (sproutFrom === 'workspace') goWorkspace()
              else goHome()
            }}
            onAll={() => goSprouts(sproutFrom)}
            onQuiz={goQuiz}
          />
        ) : null}
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.bg,
  },
})
