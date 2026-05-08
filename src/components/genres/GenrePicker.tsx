import { useState, type KeyboardEvent } from 'react'
import { Plus } from 'lucide-react'
import type { Genre } from '@/types/database'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'

type GenrePickerProps = {
  genres: Genre[]
  selectedIds: string[]
  onChange: (next: string[]) => void
  onCreateGenre: (name: string, color: string) => Promise<Genre>
}

const DEFAULT_NEW_COLOR = '#8b5cf6'

export const GenrePicker = ({
  genres,
  selectedIds,
  onChange,
  onCreateGenre,
}: GenrePickerProps) => {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(DEFAULT_NEW_COLOR)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
      return
    }
    onChange([...selectedIds, id])
  }

  const handleCreate = async () => {
    if (!newName.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await onCreateGenre(newName.trim(), newColor)
      onChange([...selectedIds, created.id])
      setNewName('')
      setNewColor(DEFAULT_NEW_COLOR)
      setAdding(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ジャンル作成に失敗しました'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    setAdding(false)
    setNewName('')
    setError(null)
  }

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      void handleCreate()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      handleCancel()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">ジャンル</span>
      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => {
          const active = selectedIds.includes(genre.id)
          const color = genre.color ?? '#64748b'
          return (
            <button
              key={genre.id}
              type="button"
              onClick={() => toggle(genre.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                active
                  ? 'border-transparent text-white'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50',
              )}
              style={
                active
                  ? { backgroundColor: color, borderColor: color }
                  : undefined
              }
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: active ? '#fff' : color }}
                aria-hidden
              />
              {genre.name}
            </button>
          )
        })}
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1 text-xs text-slate-500 hover:bg-slate-50"
          >
            <Plus className="h-3 w-3" aria-hidden />
            新規ジャンル
          </button>
        )}
      </div>

      {adding && (
        <div
          role="group"
          aria-label="新規ジャンル"
          className="mt-2 flex items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
        >
          <TextField
            label="ジャンル名"
            name="genre-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleInputKeyDown}
            required
            autoFocus
            className="flex-1"
          />
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">色</span>
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white"
            />
          </label>
          <Button
            type="button"
            size="sm"
            loading={submitting}
            onClick={() => void handleCreate()}
          >
            追加
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
          >
            キャンセル
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  )
}
