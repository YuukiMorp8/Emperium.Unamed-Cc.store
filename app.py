from flask import Flask, render_template

app = Flask(__name__)

# Dados simulados (futuramente pode vir do banco de dados)
dados = {
    "saldo_total": "R$ 150,00",
    "total_compras": 12,
    "materiais": ["Apostila Python", "Curso HTML", "Licença Premium"],
    "nivel": "Avançado"
}

@app.route("/")
def home():
    return render_template("index.html", dados=dados)

@app.route("/pagina2")
def pagina2():
    return render_template("pagina2.html")

@app.route("/pagina3")
def pagina3():
    return render_template("pagina3.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
