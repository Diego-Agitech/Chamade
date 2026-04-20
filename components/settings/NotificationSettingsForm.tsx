"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  sendTestNotificationEmailAction,
  updateNotificationPreferenceAction,
} from "@/app/(authenticated)/settings/notifications/actions";
import type { NotificationSettings } from "@/lib/db/settings";

type NotificationSettingKey = keyof NotificationSettings;

type NotificationItem = {
  key: NotificationSettingKey;
  title: string;
  description: string;
};

const notificationItems: NotificationItem[] = [
  {
    key: "notifyOnNewStay",
    title: "Nouveau séjour",
    description: "Recevoir un email quand un séjour est ajouté.",
  },
  {
    key: "notifyOnOverlap",
    title: "Chevauchement de séjours",
    description: "Recevoir un email en cas de conflit de dates.",
  },
  {
    key: "notifyOnTodoAssigned",
    title: "Todo assigné",
    description: "Recevoir un email lorsqu'une tâche m'est attribuée.",
  },
  {
    key: "notifyOnNewExpense",
    title: "Nouvelle dépense",
    description: "Recevoir un email quand une dépense est enregistrée.",
  },
  {
    key: "notifyMonthlyFinanceReport",
    title: "Rapport finance mensuel",
    description: "Recevoir le résumé mensuel des finances.",
  },
  {
    key: "notifyWeeklyDigest",
    title: "Digest hebdomadaire",
    description: "Recevoir un digest hebdomadaire des événements clés.",
  },
];

export function NotificationSettingsForm({ initialSettings }: { initialSettings: NotificationSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [pendingKey, setPendingKey] = useState<NotificationSettingKey | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | null>(null);

  async function toggleSetting(key: NotificationSettingKey) {
    const nextValue = !settings[key];
    setPendingKey(key);
    setFeedback(null);
    setFeedbackType(null);
    setSettings((prev) => ({ ...prev, [key]: nextValue }));

    const result = await updateNotificationPreferenceAction({
      key,
      enabled: nextValue,
    });

    if (!result.ok) {
      setSettings((prev) => ({ ...prev, [key]: !nextValue }));
      setFeedback(result.error ?? "Impossible de mettre à jour cette préférence.");
      setFeedbackType("error");
    } else {
      setFeedback("Préférence mise à jour.");
      setFeedbackType("success");
    }

    setPendingKey(null);
  }

  async function sendTestEmail() {
    setIsSendingTest(true);
    setFeedback(null);
    setFeedbackType(null);

    const result = await sendTestNotificationEmailAction();

    if (!result.ok) {
      setFeedback(result.error ?? "Impossible d'envoyer l'email test.");
      setFeedbackType("error");
    } else {
      setFeedback(result.message ?? "Email test traité.");
      setFeedbackType("success");
    }

    setIsSendingTest(false);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {notificationItems.map((item) => {
          const isPending = pendingKey === item.key;
          return (
            <div key={item.key} className="flex items-start justify-between gap-4 rounded-xl border border-zinc-200 p-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">{item.title}</h3>
                <p className="mt-1 text-sm text-zinc-600">{item.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings[item.key]}
                aria-label={item.title}
                onClick={() => toggleSetting(item.key)}
                disabled={isPending}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
                  settings[item.key] ? "bg-zinc-900" : "bg-zinc-300"
                } ${isPending ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white transition ${
                    settings[item.key] ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <h3 className="text-sm font-semibold text-zinc-900">Email test</h3>
        <p className="mt-1 text-sm text-zinc-600">
          Vérifie rapidement la configuration d&apos;envoi sans attendre un événement métier.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          onClick={sendTestEmail}
          disabled={isSendingTest}
        >
          {isSendingTest ? "Envoi..." : "Envoyer un email test"}
        </Button>
      </div>

      {feedback ? (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            feedbackType === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
