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

    if not (material and nome and cpf and nivel):
        return "❌ Preencha todos os campos obrigatórios!"

    if not niveis_col.find_one({"nome": nivel}):
        return "❌ Nível inválido. Adicione pelo menos um nível primeiro!"

    materiais_col.insert_one({
        "material": material,
        "nome": nome,
        "cpf": cpf,
        "nascimento": nascimento,
        "nivel": nivel
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
        dados_pix = criar_pix(valor)  # gerar PIX, mas ainda não vai para "aguardando"

        if "erro" in dados_pix:
            return f"❌ Não foi possível gerar o PIX: {dados_pix['erro']}"

        # Renderiza a tela de pagamento com QR code e botão de confirmação
        return render_template("confirmar_pagamento.html", dados=dados_pix, valor=valor)

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
    if "usuario" not in session:
        return {"status": "erro", "mensagem": "Não logado"}

    user_id = ObjectId(session["usuario"])
    transacao = db.transacoes.find_one({"txid": txid, "usuario_id": user_id})
    if not transacao:
        return {"status": "erro", "mensagem": "Transação não encontrada"}

    if verificar_pagamento_efi(txid):
        usuarios_col.update_one({"_id": user_id}, {"$inc": {"saldo": transacao["valor"]}})
        db.transacoes.update_one({"_id": transacao["_id"]}, {"$set": {"status": "concluida"}})
        return {"status": "concluida", "valor": transacao["valor"]}

    return {"status": "pendente"}
# =========================
if __name__ == "__main__":
    app.run(debug=True)
