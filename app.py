from flask import Flask, render_template, request, redirect, url_for, session
import sqlite3, os

app = Flask(__name__)
app.secret_key = "segredo_super_secreto"

DB_PATH = "banco.db"

# =========================
# FUNÇÕES BANCO
# =========================
def init_db():
    if not os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("""
        CREATE TABLE usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            senha TEXT,
            saldo REAL DEFAULT 0,
            gasto REAL DEFAULT 0,
            materiais INTEGER DEFAULT 0,
            nivel TEXT DEFAULT 'Bronze',
            foto TEXT DEFAULT '/static/default.png'
        )
        """)
        # Usuário de teste
        c.execute("INSERT INTO usuarios (nome, senha, saldo, gasto, materiais, nivel, foto) VALUES (?,?,?,?,?,?,?)",
                  ("morfeus", "1234", 150.0, 50.0, 3, "Gold", "/static/foto.png"))
        conn.commit()
        conn.close()

def get_usuario(nome):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM usuarios WHERE nome=?", (nome,))
    user = c.fetchone()
    conn.close()
    return user

# =========================
# ROTAS
# =========================
@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        nome = request.form["nome"]
        senha = request.form["senha"]
        user = get_usuario(nome)
        if user and user[2] == senha:  # senha está na coluna 2
            session["usuario"] = user[1]  # salva nome na sessão
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
        "saldo": f"R$ {user[3]:.2f}",
        "gasto": f"R$ {user[4]:.2f}",
        "materiais": user[5],
        "nivel": user[6],
        "foto": user[7],
        "nome": user[1]
    }

    return render_template("dashboard.html", dados=dados)

@app.route("/perfil")
def perfil():
    if "usuario" not in session:
        return redirect(url_for("login"))
    user = get_usuario(session["usuario"])
    return render_template("perfil.html", usuario=user)

# =========================
# MAIN
# =========================
if __name__ == "__main__":
    init_db()
    app.run(debug=True)
