import { useMemo, useState } from 'react'
import { Check, Pencil, Trash2, X } from 'lucide-react'
import type { Genre } from '@/types/database'
import type { SubscriptionWithGenres } from '@/hooks/useSubscriptions'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

type GenreManagerProps = {
  open: boolean
  onClose: () => void
  genres: Genre[]
  subscriptions: SubscriptionWithGenres[]
  onUpdate: (id: string, input: { name: string; color: string | null }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

type EditState = {
  name: string
  color: string
}

const DEFAULT_COLOR = '#64748b'

export const GenreManager = ({
  open,
  onClose,
  genres,
  subscriptions,
  onUpdate,
  onDelete,
}: GenreManagerProps) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({
    name: '',
    color: DEFAULT_COLOR,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const usageById = useMemo(() => {
    const map = new Map<string, number>()
    for (const sub of subscriptions) {
      for (const id of sub.genreIds) {
        map.set(id, (map.get(id) ?? 0) + 1)
      }
    }
    return map
  }, [subscriptions])

  const startEdit = (genre: Genre) => {
    setEditingId(genre.id)
    setEditState({ name: genre.name, color: genre.color ?? DEFAULT_COLOR })
    setError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setError(null)
  }

  const saveEdit = async (genre: Genre) => {
    const name = editState.name.trim()
    if (!name) {
      setError('ジャンル名を入力してください')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onUpdate(genre.id, { name, color: editState.color })
      setEditingId(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存に失敗しました'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const deleteGenre = async (genre: Genre) => {
    const usage = usageById.get(genre.id) ?? 0
    const message =
      usage > 0
        ? `「${genre.name}」は${usage}件のサブスクで使われています。削除するとタグ付けが解除されます。よろしいですか？`
        : `「${genre.name}」を削除します。よろしいですか？`
    if (!window.confirm(message)) return

    setSubmitting(true)
    setError(null)
    try {
      await onDelete(genre.id)
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : '削除に失敗しました'
      setError(errMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} title="ジャンル管理" onClose={onClose}>
      {genres.length === 0 ? (
        <p className="text-sm text-slate-500">
          ジャンルがまだありません。サブスク登録時の「新規ジャンル」または
          オンボーディングのプリセット追加から登録できます。
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {genres.map((genre) => {
            const usage = usageById.get(genre.id) ?? 0
            const isEditing = editingId === genre.id
            return (
              <li key={genre.id} className="flex items-center gap-3 py-3">
                {isEditing ? (
                  <>
                    <input
                      type="color"
                      value={editState.color}
                      onChange={(e) =>
                        setEditState((prev) => ({ ...prev, color: e.target.value }))
                      }
                      className="h-9 w-12 cursor-pointer rounded-lg border border-slate-300 bg-white"
                      aria-label="色"
                    />
                    <input
                      type="text"
                      value={editState.name}
                      onChange={(e) =>
                        setEditState((prev) => ({ ...prev, name: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          void saveEdit(genre)
                        } else if (e.key === 'Escape') {
                          e.preventDefault()
                          cancelEdit()
                        }
                      }}
                      autoFocus
                      aria-label="ジャンル名"
                      className="h-9 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-300"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      loading={submitting}
                      onClick={() => void saveEdit(genre)}
                    >
                      <Check className="h-4 w-4" aria-hidden />
                      保存
                    </Button>
                    <Button variant="ghost" size="sm" onClick={cancelEdit}>
                      <X className="h-4 w-4" aria-hidden />
                    </Button>
                  </>
                ) : (
                  <>
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: genre.color ?? DEFAULT_COLOR }}
                      aria-hidden
                    />
                    <span className="flex-1 truncate text-sm font-medium text-slate-800">
                      {genre.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {usage > 0 ? `${usage}件で利用中` : '未使用'}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => startEdit(genre)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                      編集
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => void deleteGenre(genre)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      削除
                    </Button>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {error && (
        <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
    </Modal>
  )
}
