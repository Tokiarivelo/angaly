import { useState } from 'react';

/**
 * Real screen's sticky share bar: Facebook, WhatsApp, and copy-link — distinct channel
 * buttons, unlike `creation-detail`'s single generic Web-Share-API button (that screen only
 * shows one "Partager" action; this one explicitly lists three).
 */
export function useShareArticle(article: { title: string }): {
  shareToFacebook: () => void;
  shareToWhatsApp: () => void;
  copyLink: () => void;
  copied: boolean;
} {
  const [copied, setCopied] = useState(false);

  const currentUrl = () => (typeof window !== 'undefined' ? window.location.href : '');

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl())}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToWhatsApp = () => {
    const text = `${article.title} ${currentUrl()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const copyLink = () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    void navigator.clipboard.writeText(currentUrl()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return { shareToFacebook, shareToWhatsApp, copyLink, copied };
}
