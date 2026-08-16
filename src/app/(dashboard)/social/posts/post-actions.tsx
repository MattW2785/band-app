"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PostActions({ postId, editable }: { postId: string; editable: boolean }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Eliminare questo post? Se è già stato pubblicato, il contenuto resterà comunque online sulla piattaforma: verrà rimossa solo la programmazione qui nell'app."
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error ?? "Eliminazione fallita");
        return;
      }
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {editable && (
        <Link
          href={`/social/posts/${postId}/edit`}
          className="text-xs font-medium text-zinc-500 dark:text-zinc-400 transition-colors hover:text-violet-600 dark:hover:text-violet-300"
        >
          Modifica
        </Link>
      )}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs font-medium text-red-500/80 dark:text-red-400/80 transition-colors hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
      >
        {deleting ? "Eliminazione..." : "Elimina"}
      </button>
    </div>
  );
}
