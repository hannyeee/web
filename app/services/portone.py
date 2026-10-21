from urllib.parse import quote

import httpx


class PortoneAPIError(Exception):
    """A sanitized failure while communicating with PortOne."""


class PortoneClient:
    def __init__(
        self,
        api_secret: str,
        base_url: str = "https://api.portone.io",
        transport: httpx.BaseTransport | None = None,
    ):
        self.base_url = base_url.rstrip("/")
        self._client = httpx.Client(
            headers={"Authorization": f"PortOne {api_secret}"},
            timeout=10.0,
            transport=transport,
        )

    def get_payment(self, payment_id: str) -> dict:
        encoded_payment_id = quote(payment_id, safe="")
        try:
            response = self._client.get(f"{self.base_url}/payments/{encoded_payment_id}")
            response.raise_for_status()
            payment = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise PortoneAPIError("PortOne payment lookup failed") from exc

        if not isinstance(payment, dict):
            raise PortoneAPIError("PortOne returned an invalid payment response")
        return payment

    def close(self) -> None:
        self._client.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.close()
