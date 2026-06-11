"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n/i18n-provider";
import { submitContactForm } from "@/actions/contact";

export function ContactForm() {
  const { t } = useI18n();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await submitContactForm({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });
    setPending(false);
    if (!res.ok) {
      toast.error(
        res.error === "validation"
          ? t("contact.error.validation")
          : t("contact.error.serviceUnavailable")
      );
      return;
    }
    toast.success(t("contact.success.title"), {
      description: t("contact.success.body"),
    });
    setName("");
    setEmail("");
    setPhone("");
    setSubject("");
    setMessage("");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="c-name">{t("contact.field.name")}</Label>
          <Input
            id="c-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-email">{t("contact.field.email")}</Label>
          <Input
            id="c-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-phone">{t("contact.field.phone")}</Label>
          <Input
            id="c-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-subject">{t("contact.field.subject")}</Label>
          <Input
            id="c-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-message">{t("contact.field.message")}</Label>
        <Textarea
          id="c-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("contact.field.message.placeholder")}
        />
      </div>
      <Button type="submit" disabled={pending} className="rounded-xl">
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> {t("contact.submitting")}
          </>
        ) : (
          t("contact.submit")
        )}
      </Button>
    </form>
  );
}
