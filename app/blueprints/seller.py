from flask import Blueprint, render_template, redirect, url_for, request, flash, jsonify
from flask_login import login_required, current_user
from functools import wraps
from app import db
from app.models import Product, Category

seller_bp = Blueprint("seller", __name__, url_prefix="/vendedor")


def seller_required(f):
    """Decorator: restrict view to seller accounts only."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_seller:
            flash("Área exclusiva para vendedores.", "warning")
            return redirect(url_for("buyer.index"))
        return f(*args, **kwargs)
    return decorated


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@seller_bp.route("/")
@login_required
@seller_required
def dashboard():
    products = (
        Product.query
        .filter_by(seller_id=current_user.id)
        .order_by(Product.created_at.desc())
        .all()
    )
    total_stock = sum(p.stock for p in products)
    active_count = sum(1 for p in products if p.is_active)
    categories = Category.query.all()

    return render_template(
        "seller/dashboard.html",
        products=products,
        total_stock=total_stock,
        active_count=active_count,
        categories=categories,
    )


# ---------------------------------------------------------------------------
# Create Product
# ---------------------------------------------------------------------------

@seller_bp.route("/produto/novo", methods=["GET", "POST"])
@login_required
@seller_required
def create_product():
    categories = Category.query.all()

    if request.method == "POST":
        data, errors = _parse_product_form(request.form)

        if errors:
            for e in errors:
                flash(e, "danger")
            return render_template("seller/product_form.html",
                                   categories=categories, form=request.form, product=None)

        product = Product(
            name=data["name"],
            description=data["description"],
            price_aoa=data["price"],
            stock=data["stock"],
            image_url=data["image_url"] or None,
            category_id=data["category_id"],
            seller_id=current_user.id,
        )
        try:
            db.session.add(product)
            db.session.commit()
            flash(f'Produto "{product.name}" adicionado com sucesso!', "success")
            return redirect(url_for("seller.dashboard"))
        except Exception:
            db.session.rollback()
            flash("Erro ao guardar o produto. Tente novamente.", "danger")

    return render_template("seller/product_form.html",
                           categories=categories, form={}, product=None)


# ---------------------------------------------------------------------------
# Edit Product
# ---------------------------------------------------------------------------

@seller_bp.route("/produto/<int:product_id>/editar", methods=["GET", "POST"])
@login_required
@seller_required
def edit_product(product_id: int):
    product = Product.query.filter_by(
        id=product_id, seller_id=current_user.id
    ).first_or_404()
    categories = Category.query.all()

    if request.method == "POST":
        data, errors = _parse_product_form(request.form)

        if errors:
            for e in errors:
                flash(e, "danger")
            return render_template("seller/product_form.html",
                                   categories=categories, form=request.form, product=product)

        product.name = data["name"]
        product.description = data["description"]
        product.price_aoa = data["price"]
        product.stock = data["stock"]
        product.image_url = data["image_url"] or None
        product.category_id = data["category_id"]
        product.is_active = data["is_active"]

        try:
            db.session.commit()
            flash(f'Produto "{product.name}" actualizado.', "success")
            return redirect(url_for("seller.dashboard"))
        except Exception:
            db.session.rollback()
            flash("Erro ao actualizar o produto.", "danger")

    return render_template("seller/product_form.html",
                           categories=categories, form={}, product=product)


# ---------------------------------------------------------------------------
# Delete Product (AJAX-friendly)
# ---------------------------------------------------------------------------

@seller_bp.route("/produto/<int:product_id>/eliminar", methods=["POST"])
@login_required
@seller_required
def delete_product(product_id: int):
    product = Product.query.filter_by(
        id=product_id, seller_id=current_user.id
    ).first_or_404()

    name = product.name
    try:
        db.session.delete(product)
        db.session.commit()
        if request.is_json:
            return jsonify({"ok": True, "message": f'"{name}" eliminado.'})
        flash(f'Produto "{name}" eliminado.', "success")
    except Exception:
        db.session.rollback()
        if request.is_json:
            return jsonify({"ok": False, "message": "Erro ao eliminar."}), 500
        flash("Erro ao eliminar o produto.", "danger")

    return redirect(url_for("seller.dashboard"))


# ---------------------------------------------------------------------------
# Toggle Active Status (AJAX)
# ---------------------------------------------------------------------------

@seller_bp.route("/produto/<int:product_id>/toggle", methods=["POST"])
@login_required
@seller_required
def toggle_product(product_id: int):
    product = Product.query.filter_by(
        id=product_id, seller_id=current_user.id
    ).first_or_404()

    product.is_active = not product.is_active
    try:
        db.session.commit()
        return jsonify({"ok": True, "is_active": product.is_active})
    except Exception:
        db.session.rollback()
        return jsonify({"ok": False}), 500


# ---------------------------------------------------------------------------
# Profile / WhatsApp number update
# ---------------------------------------------------------------------------

@seller_bp.route("/perfil", methods=["GET", "POST"])
@login_required
@seller_required
def profile():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        phone = request.form.get("phone", "").strip()

        if not name or len(name) < 2:
            flash("O nome é obrigatório.", "danger")
        else:
            current_user.name = name
            current_user.phone = phone or None
            try:
                db.session.commit()
                flash("Perfil actualizado com sucesso.", "success")
            except Exception:
                db.session.rollback()
                flash("Erro ao guardar o perfil.", "danger")

    return render_template("seller/profile.html")


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _parse_product_form(form) -> tuple[dict, list[str]]:
    """Validate and parse product form data. Returns (data_dict, errors_list)."""
    errors = []

    name = form.get("name", "").strip()
    description = form.get("description", "").strip()
    price_raw = form.get("price_aoa", "").strip()
    stock_raw = form.get("stock", "0").strip()
    image_url = form.get("image_url", "").strip()
    category_id_raw = form.get("category_id", "").strip()
    is_active = form.get("is_active") == "1"

    if not name or len(name) < 2:
        errors.append("O nome do produto é obrigatório.")

    try:
        price = float(price_raw.replace(",", "."))
        if price <= 0:
            raise ValueError
    except (ValueError, AttributeError):
        errors.append("Preço inválido. Use um número positivo.")
        price = 0.0

    try:
        stock = int(stock_raw)
        if stock < 0:
            raise ValueError
    except (ValueError, TypeError):
        errors.append("Stock inválido. Use um número inteiro não-negativo.")
        stock = 0

    try:
        category_id = int(category_id_raw)
        if not Category.query.get(category_id):
            raise ValueError
    except (ValueError, TypeError):
        errors.append("Categoria inválida.")
        category_id = None

    return {
        "name": name,
        "description": description,
        "price": price,
        "stock": stock,
        "image_url": image_url,
        "category_id": category_id,
        "is_active": is_active,
    }, errors
