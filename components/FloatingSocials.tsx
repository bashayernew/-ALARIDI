"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useSocialUrls } from "@/components/site-extras-provider";
import {
  DEFAULT_SOCIAL_URLS,
  type SocialUrlKey,
} from "@/lib/site-content-types";

type Entry =
  | {
      id: SocialUrlKey;
      href: string;
      ariaLabel: string;
      type: "text";
      text: string;
    }
  | {
      id: SocialUrlKey;
      href: string;
      ariaLabel: string;
      type: "snap";
    }
  | {
      id: SocialUrlKey;
      href: string;
      ariaLabel: string;
      type: "whatsapp";
    };

function buildEntries(urls: Record<SocialUrlKey, string>): Entry[] {
  return [
    {
      id: "instagram",
      href: urls.instagram,
      ariaLabel: "Al Aridi Sweets on Instagram",
      type: "text",
      text: "IG",
    },
    {
      id: "tiktok",
      href: urls.tiktok,
      ariaLabel: "Al Aridi Sweets on TikTok",
      type: "text",
      text: "TT",
    },
    {
      id: "snapchat",
      href: urls.snapchat,
      ariaLabel: "Al Aridi Sweets on Snapchat",
      type: "snap",
    },
    {
      id: "whatsapp",
      href: urls.whatsapp,
      ariaLabel: "Contact us on WhatsApp",
      type: "whatsapp",
    },
  ];
}

function SocialCircle({
  entry,
  className,
}: {
  entry: Entry;
  className?: string;
}) {
  return (
    <Link
      href={entry.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={entry.ariaLabel}
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full border border-primary/35 bg-card/80 text-primary shadow-sm backdrop-blur-md transition duration-300",
        "hover:scale-105 hover:border-primary/55 hover:gold-glow hover:text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        className
      )}
    >
      {entry.type === "text" ? (
        <span className="select-none font-heading text-[11px] font-semibold tracking-tight">
          {entry.text}
        </span>
      ) : entry.type === "snap" ? (
        <Send className="size-[18px]" aria-hidden />
      ) : (
        <MessageCircle className="size-[18px]" aria-hidden />
      )}
    </Link>
  );
}

export function FloatingSocials() {
  const { t } = useI18n();
  const socialUrls = useSocialUrls();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const items = React.useMemo(
    () => buildEntries(socialUrls ?? DEFAULT_SOCIAL_URLS),
    [socialUrls]
  );

  return (
    <>
      <nav
        aria-label={t("social.nav.label")}
        className="fixed start-4 top-1/2 z-[35] hidden -translate-y-1/2 md:block"
      >
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card/70 p-2.5 shadow-xl backdrop-blur-xl">
          {items.map((entry) => (
            <motion.div
              key={entry.id}
              whileHover={{ scale: 1.06 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
            >
              <SocialCircle entry={entry} />
            </motion.div>
          ))}
        </div>
      </nav>

      <div className="fixed bottom-[max(5.75rem,env(safe-area-inset-bottom,1rem))] start-1/2 z-[35] flex w-[min(100vw-1.5rem,28rem)] -translate-x-1/2 flex-col items-center gap-2 md:hidden">
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              id="mobile-connect-links"
              role="region"
              aria-label={t("social.mobile.region")}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-border bg-card/80 px-3 py-3 shadow-xl backdrop-blur-xl"
            >
              {items.map((entry) => (
                <SocialCircle key={entry.id} entry={entry} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="mobile-connect-links"
          onClick={() => setMobileOpen((o) => !o)}
          className={cn(
            "rounded-full border border-primary/40 bg-card/80 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary shadow-lg backdrop-blur-md",
            "hover:gold-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          )}
          whileTap={{ scale: 0.97 }}
        >
          {mobileOpen ? t("social.close") : t("social.connect")}
        </motion.button>
      </div>
    </>
  );
}
