import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  onFallback: () => void
}

interface State { caught: boolean }

export class HeroErrorBoundary extends Component<Props, State> {
  state: State = { caught: false }

  static getDerivedStateFromError(): State { return { caught: true } }

  componentDidCatch(_error: Error, _info: ErrorInfo) { this.props.onFallback() }

  render() {
    if (this.state.caught) return null
    return this.props.children
  }
}
