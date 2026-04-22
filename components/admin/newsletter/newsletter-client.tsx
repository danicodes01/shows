'use client'

import { useActionState, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  sendNewsletterAction,
  deleteSubscriberAction,
  deleteNewsletterSendAction,
} from '@/actions/admin/newsletter'
import type { ShowForPicker } from '@/lib/shows'
import classes from './newsletter-client.module.css'

type Subscriber = { id: string; email: string; createdAt: string }
type RecentSend = { id: string; subject: string; recipientCount: number; sentAt: string }

type Tab = 'subscribers' | 'publish' | 'history'

const SITE_URL = 'https://distortnewyork.com'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function NewsletterClient({
  subscribers,
  shows,
  recentSends,
}: {
  subscribers: Subscriber[]
  shows: ShowForPicker[]
  recentSends: RecentSend[]
}) {
  const [tab, setTab] = useState<Tab>('subscribers')
  const [selected, setSelected] = useState<Set<string>>(() => new Set(subscribers.map((s) => s.id)))
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const [sendState, sendAction, sending] = useActionState(sendNewsletterAction, {
    success: false,
  })

  const toggleAll = () => {
    if (selected.size === subscribers.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(subscribers.map((s) => s.id)))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const insertAtCursor = (text: string) => {
    const ta = bodyRef.current
    if (!ta) {
      setBody((b) => b + text)
      return
    }
    const start = ta.selectionStart ?? body.length
    const end = ta.selectionEnd ?? body.length
    const next = body.slice(0, start) + text + body.slice(end)
    setBody(next)
    requestAnimationFrame(() => {
      ta.focus()
      const pos = start + text.length
      ta.setSelectionRange(pos, pos)
    })
  }

  const wrapSelection = (prefix: string, suffix: string) => {
    const ta = bodyRef.current
    if (!ta) return
    const start = ta.selectionStart ?? body.length
    const end = ta.selectionEnd ?? body.length
    const selected = body.slice(start, end)
    const next = body.slice(0, start) + prefix + selected + suffix + body.slice(end)
    setBody(next)
    requestAnimationFrame(() => {
      ta.focus()
      if (selected.length > 0) {
        const newEnd = start + prefix.length + selected.length + suffix.length
        ta.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
        void newEnd
      } else {
        const pos = start + prefix.length
        ta.setSelectionRange(pos, pos)
      }
    })
  }

  const prefixLineOrNew = (prefix: string) => {
    const ta = bodyRef.current
    if (!ta) return
    const start = ta.selectionStart ?? body.length
    const end = ta.selectionEnd ?? body.length
    const lineStart = body.lastIndexOf('\n', start - 1) + 1
    const atLineStart = start === lineStart
    const atEmptyLine = atLineStart && (body[start] === '\n' || start === body.length)
    const insertion = atEmptyLine || atLineStart ? prefix : `\n${prefix}`
    const next = body.slice(0, start) + insertion + body.slice(end)
    setBody(next)
    requestAnimationFrame(() => {
      ta.focus()
      const pos = start + insertion.length
      ta.setSelectionRange(pos, pos)
    })
  }

  const insertShow = (show: ShowForPicker) => {
    const url = `${SITE_URL}/shows/${show.slug}`
    insertAtCursor(`[${show.title}](${url})`)
    setShowPicker(false)
    setPickerQuery('')
  }

  const filteredShows = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase()
    if (!q) return shows.slice(0, 50)
    return shows
      .filter((s) => s.title.toLowerCase().includes(q) || s.venueName.toLowerCase().includes(q))
      .slice(0, 50)
  }, [shows, pickerQuery])

  const recipientIds = useMemo(() => Array.from(selected).join(','), [selected])

  return (
    <div className={classes.wrap}>
      <nav className={classes.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'subscribers'}
          className={`${classes.tab} ${tab === 'subscribers' ? classes.tabActive : ''}`}
          onClick={() => setTab('subscribers')}
        >
          Subscribers ({selected.size}/{subscribers.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'publish'}
          className={`${classes.tab} ${tab === 'publish' ? classes.tabActive : ''}`}
          onClick={() => setTab('publish')}
        >
          Publish
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'history'}
          className={`${classes.tab} ${tab === 'history' ? classes.tabActive : ''}`}
          onClick={() => setTab('history')}
        >
          History
        </button>
      </nav>

      {tab === 'subscribers' && (
        <div className={classes.panel}>
          {subscribers.length === 0 ? (
            <p className={classes.empty}>No subscribers yet.</p>
          ) : (
            <>
              <div className={classes.tableActions}>
                <button type="button" className={classes.secondaryBtn} onClick={toggleAll}>
                  {selected.size === subscribers.length ? 'Deselect all' : 'Select all'}
                </button>
                <span className={classes.count}>{selected.size} selected for next send</span>
              </div>
              <ul className={classes.subscriberList}>
                {subscribers.map((s) => (
                  <li key={s.id} className={classes.subscriberRow}>
                    <label className={classes.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggleOne(s.id)}
                      />
                      <span className={classes.email}>{s.email}</span>
                      <span className={classes.sub}>joined {formatDate(s.createdAt)}</span>
                    </label>
                    <form
                      action={deleteSubscriberAction}
                      onSubmit={(e) => {
                        if (!confirm(`Remove ${s.email}?`)) e.preventDefault()
                      }}
                    >
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className={classes.removeBtn}>
                        Remove
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {tab === 'publish' && (
        <form action={sendAction} className={classes.panel}>
          <input type="hidden" name="recipientIds" value={recipientIds} />
          <input type="hidden" name="body" value={body} />

          <div className={classes.field}>
            <label htmlFor="subject" className={classes.label}>
              Subject
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={classes.input}
              placeholder="This week in NYC underground..."
              required
            />
          </div>

          <div className={classes.field}>
            <div className={classes.editorHeader}>
              <label htmlFor="body" className={classes.label}>
                Body (markdown)
              </label>
              <div className={classes.editorActions}>
                <button
                  type="button"
                  className={classes.secondaryBtn}
                  onClick={() => wrapSelection('**', '**')}
                  title="Select text first, or click to start bold"
                >
                  Bold
                </button>
                <button
                  type="button"
                  className={classes.secondaryBtn}
                  onClick={() => wrapSelection('*', '*')}
                  title="Select text first, or click to start italic"
                >
                  Italic
                </button>
                <button
                  type="button"
                  className={classes.secondaryBtn}
                  onClick={() => prefixLineOrNew('## ')}
                  title="Start a heading on a new line"
                >
                  Heading
                </button>
                <button
                  type="button"
                  className={classes.secondaryBtn}
                  onClick={() => prefixLineOrNew('- ')}
                  title="Start a list item"
                >
                  List
                </button>
                <button
                  type="button"
                  className={classes.secondaryBtn}
                  onClick={() => setShowPicker((v) => !v)}
                >
                  {showPicker ? 'Close shows' : '+ Insert show'}
                </button>
                <button
                  type="button"
                  className={classes.secondaryBtn}
                  onClick={() => setShowPreview((v) => !v)}
                >
                  {showPreview ? 'Edit' : 'Preview'}
                </button>
              </div>
            </div>

            {showPicker && (
              <div className={classes.picker}>
                <input
                  type="text"
                  placeholder="Search shows by title or venue..."
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  className={classes.input}
                />
                <ul className={classes.pickerList}>
                  {filteredShows.length === 0 && (
                    <li className={classes.pickerEmpty}>No matching shows</li>
                  )}
                  {filteredShows.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        className={classes.pickerRow}
                        onClick={() => insertShow(s)}
                      >
                        <span className={classes.pickerTitle}>{s.title}</span>
                        <span className={classes.pickerMeta}>
                          {s.venueName} · {formatDate(s.date)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {showPreview ? (
              <div className={classes.preview}>
                <img
                  src="/images/lightmodelogo.png"
                  alt="DistortNewYork"
                  width={100}
                  className={classes.previewLogo}
                />
                {body.trim() ? (
                  <ReactMarkdown>{body}</ReactMarkdown>
                ) : (
                  <p className={classes.empty}>Nothing to preview yet.</p>
                )}
              </div>
            ) : (
              <textarea
                id="body"
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className={classes.textarea}
                rows={16}
                placeholder="# Headline&#10;&#10;Write your newsletter here. Use **bold**, *italic*, ## headings, and - lists. Click Insert show to add show links."
              />
            )}
          </div>

          <div className={classes.sendRow}>
            <p className={classes.sendInfo}>
              Sending to <strong>{selected.size}</strong> subscriber
              {selected.size === 1 ? '' : 's'} from contact@distortnewyork.com
            </p>
            <button
              type="submit"
              className={classes.primaryBtn}
              disabled={sending || selected.size === 0 || !subject.trim() || !body.trim()}
            >
              {sending ? 'Sending...' : 'Send newsletter'}
            </button>
          </div>

          {sendState.error && (
            <p className={sendState.success ? classes.warn : classes.error}>{sendState.error}</p>
          )}
          {sendState.success && !sendState.error && (
            <p className={classes.success}>
              Sent to {sendState.sentCount} subscriber{sendState.sentCount === 1 ? '' : 's'}.
            </p>
          )}
        </form>
      )}

      {tab === 'history' && (
        <div className={classes.panel}>
          {recentSends.length === 0 ? (
            <p className={classes.empty}>No newsletters sent yet.</p>
          ) : (
            <ul className={classes.historyList}>
              {recentSends.map((s) => (
                <li key={s.id} className={classes.historyRow}>
                  <div className={classes.historyMeta}>
                    <span className={classes.historySubject}>{s.subject}</span>
                    <span className={classes.sub}>
                      {formatDate(s.sentAt)} · {s.recipientCount} recipient
                      {s.recipientCount === 1 ? '' : 's'}
                    </span>
                  </div>
                  <form
                    action={deleteNewsletterSendAction}
                    onSubmit={(e) => {
                      if (!confirm(`Delete "${s.subject}" from history?`)) e.preventDefault()
                    }}
                  >
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className={classes.removeBtn}>
                      Delete
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
