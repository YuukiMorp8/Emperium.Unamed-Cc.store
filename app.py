from flask import Flask, render_template, request, redirect, url_for, session
from pymongo import MongoClient
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
        "nivel": "Bronze",
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

@app.route("/dashboard")
def dashboard():
    if "usuario" not in session:
        return redirect(url_for("login"))

    user = usuarios_col.find_one({"_id": session["usuario"]}) or usuarios_col.find_one({"_id": ObjectId(session["usuario"])})
    if not user:
        return "Usuário não encontrado!"

    dados = {
        "nome": user["nome"],
        "saldo": f"R$ {user['saldo']:.2f}",
        "gasto": f"R$ {user['gasto']:.2f}",
        "materiais": user["materiais"],
        "nivel": user["nivel"],
        "foto": user["foto"]
    }

    return render_template("dashboard.html", dados=dados)

@app.route("/perfil")
def perfil():
    if "usuario" not in session:
        return redirect(url_for("login"))

    user = usuarios_col.find_one({"_id": ObjectId(session["usuario"])})
    return render_template("perfil.html", usuario=user)

# =========================
# Main
# =========================
if __name__ == "__main__":
    app.run(debug=True)
