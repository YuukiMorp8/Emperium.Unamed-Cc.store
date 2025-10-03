import uuid
import qrcode
import io
import base64
import os
from efipay import EfiPay

CERT_PATH = os.path.join(os.path.dirname(__file__), "produção-unamedstore.pem")

credentials = {
    'client_id': os.getenv("EFI_CLIENT_ID"),
    'client_secret': os.getenv("EFI_CLIENT_SECRET"),
    'sandbox': False,
    'certificate': CERT_PATH
}

efi = EfiPay(credentials)

def criar_pix(nome: str, cpf: str, valor: float) -> dict:
    import uuid, qrcode, io, base64
    txid = uuid.uuid4().hex
    valor_str = f"{valor:.2f}"
    body = {
        'calendario': {'expiracao': 3600},
        'devedor': {'cpf': cpf, 'nome': nome},
        'valor': {'original': valor_str},
        'chave': os.getenv("PIX_KEY"),
        'solicitacaoPagador': f'Adicionar saldo ({nome})'
    }

    try:
        response = efi.pix_create_immediate_charge(params={"txid": txid}, body=body)

        if not isinstance(response, dict) or "pixCopiaECola" not in response:
            raise ValueError("Pix copiar e colar não retornado!")

        pix_copia_cola = response["pixCopiaECola"]

        # Gerar QR code em base64
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
        # Retorna erro sem quebrar o Flask
        return {"erro": "Não foi possível gerar o PIX", "detalhes": str(e)}
