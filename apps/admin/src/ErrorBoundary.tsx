import { Component, ReactNode } from 'react'
// Shows the real error instead of a blank white screen, with a Copy button so you can send it to whoever fixes it.
export default class ErrorBoundary extends Component<{ children: ReactNode }, { err: string }> {
  state = { err: '' }
  static getDerivedStateFromError(e: unknown) { return { err: String((e as Error)?.message || e) } }
  render() {
    if (!this.state.err) return this.props.children
    return <div className="w"><div className="c"><h3>Something broke</h3><p className="neg">{this.state.err}</p><div className="row"><button onClick={() => navigator.clipboard?.writeText(this.state.err)}>Copy error</button><button className="alt" onClick={() => location.reload()}>Reload</button></div></div></div>
  }
}
