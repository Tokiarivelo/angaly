"""SSRF (Server-Side Request Forgery) protection for custom AI provider endpoints.
Specified in docs/features/ai-providers.md §6.
"""

from __future__ import annotations

import ipaddress
import os
import urllib.parse


class SsrfValidationError(ValueError):
    """Raised when an external baseUrl violates SSRF security constraints."""
    pass


def validate_provider_base_url(base_url: str | None) -> None:
    """Validates that a provider's base_url does not target internal cloud metadata
    or unauthorized private network resources.
    """
    if not base_url:
        return

    try:
        parsed = urllib.parse.urlparse(base_url)
    except Exception as exc:
        raise SsrfValidationError(f"URL de base invalide : '{base_url}'.") from exc

    scheme = (parsed.scheme or "").lower()
    hostname = (parsed.hostname or "").lower()

    if not scheme or not hostname:
        raise SsrfValidationError(f"URL de base incomplète : '{base_url}'.")

    is_localhost = hostname in {"localhost", "127.0.0.1", "::1", "[::1]"}

    # Allowed private hosts via environment variable
    allowed_hosts_raw = os.getenv("AI_ALLOWED_PRIVATE_HOSTS", "")
    allowed_hosts = {h.strip().lower() for h in allowed_hosts_raw.split(",") if h.strip()}
    is_explicitly_allowed = hostname in allowed_hosts

    is_production = os.getenv("NODE_ENV") == "production" or os.getenv("ENVIRONMENT") == "production"

    if scheme == "http":
        if not is_localhost and not is_explicitly_allowed and is_production:
            raise SsrfValidationError(
                "Seules les URLs HTTPS sécurisées sont autorisées pour les fournisseurs distants "
                "(HTTP réservé à localhost en environnement de test/développement)."
            )
    elif scheme != "https":
        raise SsrfValidationError(
            f"Protocole non supporté '{scheme}'. Seuls HTTPS (et HTTP pour localhost) sont acceptés."
        )

    # Cloud metadata services protection (AWS, GCP, Azure, etc.)
    if (
        hostname == "169.254.169.254"
        or hostname.startswith("169.254.")
        or "metadata.google.internal" in hostname
        or "instance-data" in hostname
    ):
        raise SsrfValidationError("Accès aux adresses de métadonnées d'infrastructure strictement interdit.")

    # Check for private IP ranges in production unless explicitly allowed
    if is_production and not is_explicitly_allowed and not is_localhost:
        try:
            ip = ipaddress.ip_address(hostname)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved:
                raise SsrfValidationError("Accès aux réseaux privés internes non autorisé.")
        except ValueError:
            # hostname is a domain name, check common private prefixes
            if (
                hostname.startswith("10.")
                or hostname.startswith("192.168.")
                or any(hostname.startswith(f"172.{i}.") for i in range(16, 32))
            ):
                raise SsrfValidationError("Accès aux réseaux privés internes non autorisé.")
