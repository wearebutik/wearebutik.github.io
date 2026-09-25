/**
 * CtaBanner — molecola del catalogo @butik/ui.
 *
 * Isola React puramente presentazionale: titolo, body opzionale, CTA
 * primaria + secondaria opzionale. Il tracking PostHog dei click resta a
 * livello app (`apps/web/src/components/CtaBanner.astro`, un wrapper
 * sottile) perché usa un alias app-only (`#lib/analytics/posthog.client`,
 * ADR-0007) non risolvibile da `packages/ui` — vedi ADR-0008 amendment
 * 2026-07-21. CSS Modules + token (ADR-0005). Le CTA sono `Button` (PDR-0001,
 * PDR-0005): scura la primaria, ghost la secondaria.
 */
import Button from '../atoms/Button';
import styles from './CtaBanner.module.css';

interface CtaLink {
  label: string;
  href: string;
}

export interface CtaBannerProps {
  title: string;
  body?: string;
  primaryCta: CtaLink;
  secondaryCta?: CtaLink;
}

export default function CtaBanner({ title, body, primaryCta, secondaryCta }: CtaBannerProps) {
  return (
    <section className={styles.banner} data-cta-banner>
      <div className={styles.inner}>
        <div className={styles.content}>
          <h2 className={styles.title}>{title}</h2>
          {body && <p className={styles.body}>{body}</p>}
        </div>

        <div className={styles.actions}>
          <Button href={primaryCta.href} tone="dark" className={styles.action}>
            {primaryCta.label}
          </Button>
          {secondaryCta && (
            <Button href={secondaryCta.href} variant="ghost" className={styles.action}>
              {secondaryCta.label}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
