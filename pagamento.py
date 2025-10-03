import uuid
import qrcode
import io
import base64
import os
from efipay import EfiPay

CERT_PATH = os.path.join(os.path.dirname(__file__), "Prod store.pem")

credentials = {
    'client_id': os.environ.get("EFI_CLIENT_ID"),
    'client_secret': os.environ.get("EFI_CLIENT_SECRET"),
    'sandbox': False,
    'certificate': CERT_PATH
}

efi = EfiPay(credentials)

def criar_pix(valor: float) -> dict:
    try:
        txid = uuid.uuid4().hex
        valor_str = f"{valor:.2f}"
        body = {
            'calendario': {'expiracao': 3600},
            'valor': {'original': valor_str},
            'chave': os.getenv("PIX_KEY"),
            'solicitacaoPagador': f'Adicionar saldo de R$ {valor_str}'
        }

        response = efi.pix_create_immediate_charge(params={"txid": txid}, body=body)

        pix_copia_cola = response.get("pixCopiaECola")
        if not pix_copia_cola:
            return {"erro": "Pix copiar e colar não retornado!"}

        img = qrcode.make(pix_copia_cola)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        img_b64 = base64.b64encode(buf.getvalue()).decode()

        return {
            "txid": txid,
            "valor": valor_str,
            "pix_copia_cola": pix_copia_cola,
            "qrcode_b64": img_b64
        }

    except Exception as e:
        return {"erro": str(e)}
