from flask import Flask, render_template, request, redirect, url_for, session
from pymongo import MongoClient
from bson.objectid import ObjectId
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

# =========================
# Rotas
# =========================
@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        nome = request.form["nome"]
        senha = request.form["senha"]
        user = get_usuario(nome)
        if user and user["senha"] == senha:
            session["usuario"] = str(user["_id"])  # armazenamos o ID do Mongo
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

@app.route("/perfil")
def perfil():
    if "usuario" not in session:
        return redirect(url_for("login"))

    user = usuarios_col.find_one({"_id": ObjectId(session["usuario"])})
    return render_template("perfil.html", usuario=user)

@app.route("/dashboard")
def dashboard():
    if "usuario" not in session:
        return redirect(url_for("login"))

    user = usuarios_col.find_one({"_id": ObjectId(session["usuario"])})

    # Conta quantos materiais existem para esse usuário
    materiais_user = materiais_col.find({"usuario_id": str(user["_id"])})
    total_materiais = materiais_col.count_documents({"usuario_id": str(user["_id"])})

    # Buscar níveis com valores
    niveis = {n["nome"]: n["valor"] for n in niveis_col.find()}

    # Calcula total gasto desse usuário
    total_gasto = 0
    for m in materiais_user:
        if "nivel" in m and m["nivel"] in niveis:
            total_gasto += niveis[m["nivel"]]

    dados = {
        "nome": user["nome"],
        "saldo": f"R$ {user.get('saldo', 0):.2f}",
        "gasto": f"R$ {total_gasto:.2f}",
        "materiais": total_materiais,
        "foto": user.get("foto", "/static/default.png")
    }

    niveis_lista = [n["nome"] for n in niveis_col.find({}, {"_id": 0, "nome": 1})]

    return render_template("dashboard.html", dados=dados, niveis=niveis_lista)

@app.route("/admin_login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        nome_admin = request.form["nome_admin"].strip()
        senha_admin = request.form["senha_admin"].strip()

        # Buscar admin na coleção correta
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

    # Buscar dados necessários para o painel de admin
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

    # Verificar se o nível existe
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

# Main
# =========================
if __name__ == "__main__":
    app.run(debug=True)
