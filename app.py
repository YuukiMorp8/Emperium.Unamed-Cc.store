from flask import Flask, render_template, request, redirect, url_for, session
import sqlite3
import os

app = Flask(__name__)
app.secret_key = "segredo_super_secreto"

DB_PATH = "/tmp/banco.db"  # caminho gravável no Render

# =========================
# Inicializar banco
# =========================
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT UNIQUE,
        senha TEXT,
        indicado_por TEXT,
        saldo REAL DEFAULT 0,
        gasto REAL DEFAULT 0,
        materiais INTEGER DEFAULT 0,
        nivel TEXT DEFAULT 'Bronze',
        foto TEXT DEFAULT '/static/default.png'
    )
    """)
    conn.commit()
    conn.close()

# Chamada direta para garantir que o banco exista
init_db()

# =========================
# Funções de banco
# =========================
def criar_usuario(nome, senha, indicado_por=None):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    try:
        c.execute(
            "INSERT INTO usuarios (nome, senha, indicado_por) VALUES (?,?,?)",
            (nome, senha, indicado_por)
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def get_usuario(nome):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM usuarios WHERE nome=?", (nome,))
    user = c.fetchone()
    conn.close()
    return user

# =========================
# Rotas
# =========================
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
            session["usuario"] = nome
            return redirect(url_for("dashboard"))
        else:
            return "❌ Usuário já existe!"

    return render_template("register.html")

@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        nome = request.form["nome"]
        senha = request.form["senha"]
        user = get_usuario(nome)
        if user and user[2] == senha:  # senha está na coluna 2
            session["usuario"] = nome
            return redirect(url_for("dashboard"))
        return "❌ Usuário ou senha incorretos!"
    return render_template("login.html")

@app.route("/dashboard")
def dashboard():
    if "usuario" not in session:
        return redirect(url_for("login"))

    user = get_usuario(session["usuario"])
    if not user:
        return "Usuário não encontrado!"

    dados = {
        "nome": user[1],
        "saldo": f"R$ {user[4]:.2f}",
        "gasto": f"R$ {user[5]:.2f}",
        "materiais": user[6],
        "nivel": user[7],
        "foto": user[8]
    }

    return render_template("dashboard.html", dados=dados)

@app.route("/perfil")
def perfil():
    if "usuario" not in session:
        return redirect(url_for("login"))

    user = get_usuario(session["usuario"])
    return render_template("perfil.html", usuario=user)

# =========================
# Main
# =========================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)), debug=True)
