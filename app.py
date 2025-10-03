from flask import Flask, render_template, request, redirect, url_for, session
from pymongo import MongoClient
from bson.objectid import ObjectId
from pagamento import criar_pix, verificar_pagamento_efi  # função que verifica o PIX
import time
import os

app = Flask(__name__)
app.secret_key = "segredo_super_secreto"

# =========================
# Conexão com MongoDB
# =========================
MONGO_URI = os.environ.get("MONGO_URI")  # Defina essa variável no Render
client = MongoClient(MONGO_URI)
db = client["EMPERIUMCC"]  # nome do database
usuarios_col = db["User"]  # nome da collection
niveis_col = db["Niveis"] 
materiais_col = db["Materiais"]
admins_col = db["Admins"] 
# =========================
# Funções de banco
# =========================   
def criar_usuario(nome, senha, indicado_por=None):
    if usuarios_col.find_one({"nome": nome}):
        return False
    usuarios_col.insert_one({
        "nome": nome,
        "senha": senha,
        "indicado_por": indicado_por,
        "saldo": 0.0,
        "gasto": 0.0,
        "materiais": 0,
        "foto": "/static/default.png"
    })
    return True

def get_usuario(nome):
    return usuarios_col.find_one({"nome": nome})

#-----------------
# LOGIN / REGISTRO
#-----------------
@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        nome = request.form["nome"]
        senha = request.form["senha"]
        user = get_usuario(nome)
        if user and user["senha"] == senha:
            session["usuario"] = str(user["_id"])
            return redirect(url_for("dashboard"))
        return "❌ Usuário ou senha incorretos!"
    return render_template("login.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        nome = request.form["nome"]
        senha = request.form["senha"]
        confirma_senha = request.form["confirma_senha"]
        indicado_por = request.form.get("indicado_por") or None

        if senha != confirma_senha:
            return "❌ Senha e confirmação não conferem!"

        if criar_usuario(nome, senha, indicado_por):
            user = get_usuario(nome)
            session["usuario"] = str(user["_id"])
            return redirect(url_for("dashboard"))
        else:
            return "❌ Usuário já existe!"
    return render_template("register.html")

#-----------------
# USUÁRIO / PERFIL / DASHBOARD
#-----------------
import uuid
import os

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    
@app.route("/perfil", methods=["GET", "POST"])
def perfil():
    if "usuario" not in session:
        return redirect(url_for("login"))

    user = usuarios_col.find_one({"_id": ObjectId(session["usuario"])})
    mensagem = None

    if request.method == "POST":
        # Alterar nome
        novo_nome = request.form.get("novo_nome")
        if novo_nome:
            usuarios_col.update_one({"_id": user["_id"]}, {"$set": {"nome": novo_nome}})
            mensagem = "✅ Nome alterado com sucesso!"
            user["nome"] = novo_nome

        # Alterar senha
        senha_atual = request.form.get("senha_atual")
        nova_senha = request.form.get("nova_senha")
        confirma_senha = request.form.get("confirma_senha")
        if senha_atual and nova_senha and confirma_senha:
            if senha_atual != user["senha"]:
                mensagem = "❌ Senha atual incorreta!"
            elif nova_senha != confirma_senha:
                mensagem = "❌ Confirmação da nova senha não confere!"
            else:
                usuarios_col.update_one({"_id": user["_id"]}, {"$set": {"senha": nova_senha}})
                mensagem = "✅ Senha alterada com sucesso!"

        # Alterar foto de perfil (apenas salva o nome/caminho no Mongo)
        if "foto_perfil" in request.files:
            file = request.files["foto_perfil"]
            if file and allowed_file(file.filename):
                # Gera nome único
                ext = file.filename.rsplit('.', 1)[1].lower()
                filename = f"{uuid.uuid4().hex}.{ext}"  # Ex: 100000.png
                filepath = f"static/uploads/{filename}"  # Caminho virtual

                # Apenas salva o caminho no MongoDB
                usuarios_col.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"foto": filepath}}
                )
                mensagem = "✅ Foto de perfil atualizada!"
                user["foto"] = filepath

    return render_template("perfil.html", usuario=user, mensagem=mensagem)
    
@app.route("/dashboard")
def dashboard():
    if "usuario" not in session:
        return redirect(url_for("login"))

    user = usuarios_col.find_one({"_id": ObjectId(session["usuario"])})
    if not user:
        return redirect(url_for("login"))

    total_materiais = materiais_col.count_documents({})
    niveis = [n["nome"] for n in niveis_col.find({}, {"_id": 0, "nome": 1})]

    dados = {
        "nome": user["nome"],
        "saldo": f"R$ {user.get('saldo', 0):.2f}",
        "gasto": f"R$ {user.get('gasto', 0):.2f}",
        "materiais": total_materiais,
        "foto": user.get("foto", "/static/default.png")
    }

    return render_template("dashboard.html", dados=dados, niveis=niveis)

#-----------------
# ADMIN
#-----------------
@app.route("/admin_login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        nome_admin = request.form["nome_admin"].strip()
        senha_admin = request.form["senha_admin"].strip()
        admin = admins_col.find_one({"nome": nome_admin})

        if admin and admin.get("senha", "").strip() == senha_admin:
            session["admin"] = str(admin["_id"])
            return redirect(url_for("admin_panel"))

        return "❌ Nome ou senha do admin incorretos!"

    return render_template("admin_login.html")


@app.route("/admin_panel")
def admin_panel():
    if "admin" not in session:
        return redirect(url_for("admin_login"))

    usuarios = list(usuarios_col.find())
    niveis = list(niveis_col.find())
    materiais = list(materiais_col.find())

    return render_template("admin_panel.html", usuarios=usuarios, niveis=niveis, materiais=materiais)


@app.route("/add_nivel", methods=["POST"])
def add_nivel():
    if "admin" not in session:
        return redirect(url_for("admin_login"))

    nome = request.form.get("nivel_nome")
    valor = request.form.get("nivel_valor")

    if not nome or not valor:
        return "❌ Preencha todos os campos!"

    niveis_col.insert_one({"nome": nome, "valor": float(valor)})
    return redirect(url_for("admin_panel"))

@app.route("/add_material", methods=["POST"])
def add_material():
    if "admin" not in session:
        return redirect(url_for("admin_login"))

    material = request.form.get("material")
    nome = request.form.get("nome")
    cpf = request.form.get("cpf")
    nascimento = request.form.get("nascimento") or None
    nivel = request.form.get("nivel")
    banco = request.form.get("banco")  # novo campo

    if not (material and nome and cpf and nivel and banco):
        return "❌ Preencha todos os campos obrigatórios!"

    if not niveis_col.find_one({"nome": nivel}):
        return "❌ Nível inválido. Adicione pelo menos um nível primeiro!"

    materiais_col.insert_one({
        "material": material,
        "nome": nome,
        "cpf": cpf,
        "nascimento": nascimento,
        "nivel": nivel,
        "banco": banco  # salvar no MongoDB
    })

    return redirect(url_for("admin_panel"))
#-----------------
# PAGAMENTO PIX
#-----------------
@app.route("/adicionar_saldo", methods=["GET", "POST"])
def adicionar_saldo_user():
    if "usuario" not in session:
        return redirect(url_for("login"))

    user = usuarios_col.find_one({"_id": ObjectId(session["usuario"])})

    if request.method == "POST":
        valor = float(request.form["quantia"])
        dados_pix = criar_pix(valor)  # apenas valor

        if "erro" in dados_pix:
            return f"❌ Não foi possível gerar o PIX corretamente: {dados_pix['erro']}"

        # Salva a transação como pendente
        db.transacoes.insert_one({
            "usuario_id": user["_id"],
            "txid": dados_pix["txid"],
            "valor": valor,
            "status": "pendente"
        })

        # Redireciona para a página de pagamento (com QR Code e botão)
        return render_template("pagamento.html", dados=dados_pix, valor=valor)

    return render_template("adicionar_saldo.html")

@app.route("/aguardando_pagamento/<txid>")
def aguardando_pagamento(txid):
    if "usuario" not in session:
        return redirect(url_for("login"))

    user_id = ObjectId(session["usuario"])
    transacao = db.transacoes.find_one({"txid": txid, "usuario_id": user_id})
    if not transacao:
        return "❌ Transação não encontrada!"

    return render_template("aguardando_pagamento.html", txid=txid)

@app.route("/verificar_pagamento_ajax/<txid>")
def verificar_pagamento_ajax(txid):
    print("=== Verificando PIX AJAX ===")
    print("txid recebido:", txid)
    print("usuario na sessão:", session.get("usuario"))

    if "usuario" not in session:
        return {"status": "erro", "mensagem": "Não logado"}

    user_id = ObjectId(session["usuario"])
    transacao = db.transacoes.find_one({"txid": txid, "usuario_id": user_id})
    print("Transacao encontrada:", transacao)

    if not transacao:
        return {"status": "erro", "mensagem": "Transação não encontrada"}

    pago = verificar_pagamento_efi(txid)
    print("Pagamento verificado:", pago)

    if pago:
        # 🔒 Proteção contra crédito duplicado
        if transacao["status"] != "concluida":
            valor_float = round(float(transacao["valor"]), 2)
            usuarios_col.update_one(
                {"_id": user_id},
                {"$inc": {"saldo": valor_float}}
            )
            db.transacoes.update_one(
                {"_id": transacao["_id"]},
                {"$set": {"status": "concluida"}}
            )
            print(f"✅ Saldo incrementado: +{valor_float}")
        else:
            print("⚠️ Transação já concluída, saldo não incrementado novamente.")

        return {"status": "concluida", "valor": float(transacao["valor"])}

    return {"status": "pendente"}

def censurar_numero(numero: str) -> str:
    """Mostra os 6 primeiros dígitos e censura os 10 seguintes com '*'"""
    if len(numero) <= 6:
        return numero[:6] + '*' * max(0, len(numero) - 6)
    return numero[:6] + '*' * 10  # sempre 6 visíveis e 10 censurados

@app.route("/comprar", methods=["GET"])
def comprar():
    if "usuario" not in session:
        return redirect(url_for("login"))

    user = usuarios_col.find_one({"_id": ObjectId(session["usuario"])})
    materiais = list(materiais_col.find())
    niveis = {n["nome"]: n["valor"] for n in niveis_col.find()}

    filtros = {
        "nivel": request.args.get("nivel"),
        "banco": request.args.get("banco"),
        "pesquisa": request.args.get("pesquisa"),
        "valor_min": request.args.get("valor")
    }

    resultados = []
    for mat in materiais:
        bin_val = mat["material"].split("/")[0]  # pega só o número principal
        nivel = mat.get("nivel", "Desconhecido")
        banco = mat.get("banco", "Desconhecido")
        valor = niveis.get(nivel, 0)

        # aplica filtros
        if filtros["pesquisa"] and not bin_val.startswith(filtros["pesquisa"]):
            continue
        if filtros["nivel"] and nivel.lower() != filtros["nivel"].lower():
            continue
        if filtros["banco"] and banco.lower() != filtros["banco"].lower():
            continue
        if filtros["valor_min"]:
            try:
                if valor < float(filtros["valor_min"]):
                    continue
            except:
                pass

        # adiciona material censurado
        resultados.append({
            "_id": str(mat["_id"]),
            "material": censurar_numero(bin_val),
            "nivel": nivel,
            "banco": banco,
            "valor": valor
        })

    return render_template(
        "comprar.html",
        usuario=user,
        resultados=resultados,
        filtros=filtros,
        niveis=niveis
    )
    
@app.route("/comprar_finalize", methods=["POST"])
def comprar_finalize():
    if "usuario" not in session:
        return {"ok": False, "msg": "Não logado"}, 401

    user = usuarios_col.find_one({"_id": ObjectId(session["usuario"])})
    if not user:
        return {"ok": False, "msg": "Usuário não encontrado"}, 404

    material_id = request.form.get("material_id")
    senha_confirm = request.form.get("senha_confirm")

    if not material_id or not senha_confirm:
        return {"ok": False, "msg": "Dados inválidos!"}, 400

    if senha_confirm != user["senha"]:
        return {"ok": False, "msg": "Senha incorreta!"}, 403

    material = materiais_col.find_one({"_id": ObjectId(material_id)})
    if not material:
        return {"ok": False, "msg": "Material não encontrado!"}, 404

    nivel = material.get("nivel")
    valor = niveis_col.find_one({"nome": nivel}).get("valor", 0)

    if user["saldo"] < valor:
        return {"ok": False, "msg": "Saldo insuficiente!"}, 400

    # Desconta e registra compra
    usuarios_col.update_one(
        {"_id": user["_id"]},
        {"$inc": {"saldo": -valor, "gasto": valor}}
    )
    db.compras.insert_one({
        "usuario_id": user["_id"],
        "material_id": material["_id"],
        "valor": valor,
        "data": time.strftime("%d/%m/%Y %H:%M:%S")
    })

    return {"ok": True, "msg": "Compra concluída!"}
# =========================
if __name__ == "__main__":
    app.run(debug=True)
