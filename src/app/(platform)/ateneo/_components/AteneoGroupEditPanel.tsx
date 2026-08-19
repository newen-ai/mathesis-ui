"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAteneoGroup, updateAteneoGroup, type AteneoGroup } from "@/lib/api/ateneo";
import { AteneoGroupForm } from "./AteneoGroupForm";

type AteneoGroupEditPanelProps = {
  groupId: string;
};

export function AteneoGroupEditPanel({ groupId }: AteneoGroupEditPanelProps) {
  const router = useRouter();
  const [group, setGroup] = useState<AteneoGroup | null>(null);
  const [rules, setRules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const response = await getAteneoGroup(groupId);
        if (cancelled) return;
        setGroup(response.data.group);
        setRules(response.data.rules);
      } catch {
        if (cancelled) return;
        setGroup(null);
        setRules([]);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [groupId]);

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-scale-3 text-[var(--text-secondary)]">Cargando grupo...</p>
      </section>
    );
  }

  if (!group) {
    return (
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-scale-3 text-[var(--text-secondary)]">No pudimos cargar este grupo.</p>
      </section>
    );
  }

  if (!group.isAdmin) {
    return (
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-scale-3 text-[var(--text-secondary)]">Solo los administradores pueden editar este grupo.</p>
      </section>
    );
  }

  return (
    <AteneoGroupForm
      title="Editar grupo"
      submitLabel="Guardar cambios"
      backHref={`/ateneo/groups/${encodeURIComponent(groupId)}`}
      backLabel="Volver al grupo"
      initialValues={{
        iconId: group.icon,
        name: group.name,
        description: group.description ?? "",
        rules: rules.join("\n"),
        createTopicsMode: group.createTopicsMode,
        commentsMode: group.commentsMode,
        isOfficialGroup: group.isOfficial
      }}
      onSubmit={async (values) => {
        const rulesList = values.rules
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean);

        await updateAteneoGroup(groupId, {
          name: values.name.trim(),
          description: values.description.trim(),
          icon: values.iconId,
          isOfficial: values.isOfficialGroup,
          rules: rulesList,
          createTopicsMode: values.createTopicsMode,
          commentsMode: values.commentsMode
        });

        router.push(`/ateneo/groups/${encodeURIComponent(groupId)}`);
      }}
    />
  );
}
