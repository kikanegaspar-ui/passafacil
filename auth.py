from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_user, logout_user, login_required, current_user
from app import db
from app.models import User

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("buyer.index"))

    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip().lower()
        phone = request.form.get("phone", "").strip()
        password = request.form.get("password", "")
        confirm = request.form.get("confirm_password", "")
        role = request.form.get("role", "buyer")

        # --- Validation ---
        errors = []
        if not name or len(name) < 2:
            errors.append("O nome deve ter pelo menos 2 caracteres.")
        if not email or "@" not in email:
            errors.append("Endereço de e-mail inválido.")
        if len(password) < 6:
            errors.append("A senha deve ter pelo menos 6 caracteres.")
        if password != confirm:
            errors.append("As senhas não coincidem.")
        if role not in ("buyer", "seller"):
            errors.append("Tipo de conta inválido.")

        if errors:
            for err in errors:
                flash(err, "danger")
            return render_template("auth/register.html", form=request.form)

        if User.query.filter_by(email=email).first():
            flash("Este e-mail já está registado. Tente fazer login.", "warning")
            return render_template("auth/register.html", form=request.form)

        user = User(name=name, email=email, phone=phone or None, role=role)
        user.set_password(password)

        try:
            db.session.add(user)
            db.session.commit()
            login_user(user)
            flash(f"Bem-vindo(a), {user.name}! A sua conta foi criada.", "success")
            return redirect(
                url_for("seller.dashboard") if user.is_seller else url_for("buyer.index")
            )
        except Exception:
            db.session.rollback()
            flash("Erro interno. Tente novamente.", "danger")

    return render_template("auth/register.html", form={})


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("buyer.index"))

    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        remember = bool(request.form.get("remember"))

        user = User.query.filter_by(email=email).first()

        if not user or not user.check_password(password):
            flash("E-mail ou senha incorretos.", "danger")
            return render_template("auth/login.html", email=email)

        login_user(user, remember=remember)
        flash(f"Bem-vindo(a) de volta, {user.name}!", "success")

        next_page = request.args.get("next")
        if next_page and next_page.startswith("/"):
            return redirect(next_page)

        return redirect(
            url_for("seller.dashboard") if user.is_seller else url_for("buyer.index")
        )

    return render_template("auth/login.html", email="")


@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    flash("Sessão terminada com sucesso.", "info")
    return redirect(url_for("buyer.index"))
