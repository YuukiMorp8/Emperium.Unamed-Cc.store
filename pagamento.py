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

def verificar_pagamento_efi(txid: str) -> bool:
    try:
        response = efi.pix_detail_charge(params={"txid": txid})
        print("DEBUG PIX DETAIL:", response)

        # Tenta pegar status em vários formatos
        status = (
            response.get("status")
            or response.get("cob", {}).get("status")
            or ""
        ).strip().lower()

        print(f"DEBUG STATUS: '{status}' para txid {txid}")

        return status in ["concluida", "concluído", "concluido"]
    except Exception as e:
        print(f"❌ Erro ao verificar PIX: {e}")
        return False

def criar_pix(valor: float) -> dict:
    try:
        valor_com_taxa = round(valor * 1.10, 2)  # adiciona 10%
        valor_str = f"{valor_com_taxa:.2f}"

        body = {
            'calendario': {'expiracao': 3600},
            'valor': {'original': valor_str},
            'chave': os.getenv("PIX_KEY"),
            'solicitacaoPagador': f'Adicionar saldo de R$ {valor:.2f} (com taxa)'
        }

        response = efi.pix_create_immediate_charge(params={}, body=body)
        txid_api = response.get("txid")
        pix_copia_cola = response.get("pixCopiaECola")
        if not pix_copia_cola:
            return {"erro": "Pix copiar e colar não retornado!"}

        # QR Code
        img = qrcode.make(pix_copia_cola)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        img_b64 = base64.b64encode(buf.getvalue()).decode()

        return {
            "txid": txid_api,
            "valor_total": valor_com_taxa,   # o que o user paga
            "valor_depositado": valor,       # o que entra no saldo
            "pix_copia_cola": pix_copia_cola,
            "qrcode_b64": img_b64
        }
    except Exception as e:
        return {"erro": str(e)}
