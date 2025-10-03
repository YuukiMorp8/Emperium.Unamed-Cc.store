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
    """
    Verifica se a transação PIX foi concluída.
    Retorna True se o pagamento foi feito, False caso contrário.
    """
    try:
        response = efi.pix_detail_charge(params={"txid": txid})
        print("DEBUG PIX DETAIL:", response)  # <--- Adicione esta linha
        status = response.get("status", "").strip().lower()
        print(f"DEBUG STATUS: '{status}' para txid {txid}")
        # Status esperado: 'concluida', 'concluído', 'concluido'
        return status in ["concluida", "concluído", "concluido"]
    except Exception as e:
        print(f"❌ Erro ao verificar PIX: {e}")
        return False

def criar_pix(valor: float) -> dict:
    try:
        valor_str = f"{valor:.2f}"
        body = {
            'calendario': {'expiracao': 3600},
            'valor': {'original': valor_str},
            'chave': os.getenv("PIX_KEY"),
            'solicitacaoPagador': f'Adicionar saldo de R$ {valor_str}'
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
            "valor": valor_str,
            "pix_copia_cola": pix_copia_cola,
            "qrcode_b64": img_b64
        }
    except Exception as e:
        return {"erro": str(e)}
