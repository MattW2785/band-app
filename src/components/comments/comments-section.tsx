import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { addComment, deleteComment } from "@/app/(dashboard)/comments/actions";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { CommentParentType } from "@/types/database";

export interface CommentWithAuthor {
  id: string;
  text: string;
  created_at: string;
  authorName: string | null;
}

interface CommentsBodyProps {
  comments: CommentWithAuthor[];
  parentType: CommentParentType;
  parentId: string;
  revalidatePath: string;
}

function CommentsBody({ comments, parentType, parentId, revalidatePath }: CommentsBodyProps) {
  return (
    <div>
      <ul className="space-y-3">
        {comments.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-sm">
            <Avatar name={c.authorName ?? "?"} className="mt-0.5 h-6 w-6 shrink-0 text-[10px]" />
            <div className="min-w-0 flex-1">
              <p className="text-zinc-800 dark:text-zinc-200">{c.text}</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {c.authorName ?? "Qualcuno"} · {format(parseISO(c.created_at), "d MMM 'alle' HH:mm", { locale: it })}
              </p>
            </div>
            <form action={deleteComment}>
              <input type="hidden" name="comment_id" value={c.id} />
              <input type="hidden" name="revalidate_path" value={revalidatePath} />
              <button type="submit" className="shrink-0 text-xs text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400">
                ✕
              </button>
            </form>
          </li>
        ))}
        {comments.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">Nessun commento ancora.</p>}
      </ul>

      <form action={addComment} className="mt-3 flex gap-2">
        <input type="hidden" name="parent_type" value={parentType} />
        <input type="hidden" name="parent_id" value={parentId} />
        <input type="hidden" name="revalidate_path" value={revalidatePath} />
        <Textarea name="text" rows={1} placeholder="Scrivi un commento…" className="flex-1 resize-none" required />
        <Button type="submit" variant="secondary">
          Invia
        </Button>
      </form>
    </div>
  );
}

export function CommentsSection({ title, ...body }: CommentsBodyProps & { title?: string }) {
  return (
    <div>
      <h2 className="mb-3 font-medium text-zinc-900 dark:text-zinc-100">{title ?? "Commenti"}</h2>
      <CommentsBody {...body} />
    </div>
  );
}

export function CollapsibleComments(props: CommentsBodyProps) {
  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer list-none text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300">
        💬 {props.comments.length} {props.comments.length === 1 ? "commento" : "commenti"}
      </summary>
      <div className="mt-2 border-t border-zinc-100 dark:border-zinc-800 pt-2">
        <CommentsBody {...props} />
      </div>
    </details>
  );
}
